/// <reference path="../../types/global.d.ts" />
import { readFileSync } from 'fs'
import { join } from 'path'
import { IPublishPacket } from 'mqtt-packet'
import { encodeBatchPayload } from '../../utils/batchPublishing'
import { createBatchBroker } from '../../../tests/helpers/batchBroker'

jest.setTimeout(60000)

describe('batch sub', () => {
  const broker = createBatchBroker()
  const { listen, write, connack, launch } = broker

  const quoteBroker = async () => {
    const messages = ['{"id":"device-001","temp":23.1}', 'a\nb\rc\t\0\u001b', 'C:\\data\\device\\n', 'say "hello"']
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'subscribe') {
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: [0] })
        write(socket, {
          cmd: 'publish',
          topic: 'demo',
          qos: 0,
          retain: false,
          dup: false,
          payload: encodeBatchPayload(messages.map((message) => Buffer.from(message))),
          properties: { userProperties: { 'batch-format': 'v1', 'batch-size': String(messages.length) } },
        })
      }
    })

    return { port, messages }
  }

  it('preserves quotes and backslashes while displaying controls on one line', async () => {
    const { port } = await quoteBroker()
    const subscriber = launch(port, ['sub', '-b', '-t', 'demo'])
    await subscriber.until('[4]')
    subscriber.child.kill('SIGINT')
    const result = await subscriber.closed
    expect(result.stdout.split(/\r?\n/).filter((line) => /^\[\d+\]/.test(line))).toEqual([
      '[1] {"id":"device-001","temp":23.1}',
      '[2] a\\nb\\rc\\u0009\\u0000\\u001b',
      '[3] C:\\data\\device\\n',
      '[4] say "hello"',
    ])
  })

  it('preserves item content in clean JSON', async () => {
    const { port, messages } = await quoteBroker()
    const clean = launch(port, ['sub', '-b', '-t', 'demo', '--output-mode', 'clean'])
    await clean.until('"batch":')
    clean.child.kill('SIGINT')
    expect(JSON.parse((await clean.closed).stdout).batch.items).toEqual(messages)
  })

  const sequenceBroker = async () => {
    const payload = encodeBatchPayload([Buffer.from('first'), Buffer.alloc(0), Buffer.from('last')])
    const valid = (topic: string, messageId: number): IPublishPacket => ({
      cmd: 'publish',
      topic,
      qos: 1,
      retain: false,
      dup: false,
      messageId,
      payload,
      properties: topic.startsWith('$batch/')
        ? undefined
        : { userProperties: { 'batch-format': 'v1', 'batch-size': '3' } },
    })
    let acknowledgements = 0
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'subscribe') {
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: [1] })
        write(socket, {
          ...valid('demo', 1),
          payload: Buffer.from('000166000267', 'hex'),
          properties: { userProperties: { 'batch-format': 'v1', 'batch-size': '2' } },
        })
        write(socket, valid('demo', 2))
        write(socket, valid('$batch/3/demo', 3))
        write(socket, {
          cmd: 'publish',
          topic: 'demo',
          qos: 1,
          dup: false,
          retain: false,
          messageId: 4,
          payload: Buffer.from('after-batch'),
        })
      }
      if (packet.cmd === 'puback') acknowledgements++
    })

    return { port, payload, acknowledgements: () => acknowledgements }
  }

  it('rejects atomically, continues with both carriers, and appends each item', async () => {
    const { port, acknowledgements } = await sequenceBroker()
    const file = join(broker.directory, 'items.out')
    const sub = launch(port, [
      'sub',
      '-b',
      '-t',
      'demo',
      '--output-mode',
      'clean',
      '--file-write',
      file,
      '--delimiter',
      '|',
    ])
    await sub.until('after-batch')
    sub.child.kill('SIGINT')
    const result = await sub.closed
    const outputs = JSON.parse(`[${result.stdout.trim().replace(/}\s*{/g, '},{')}]`)
    expect(outputs).toHaveLength(4)
    expect(outputs[0].batch.error).toBe('TRUNCATED_ITEM')
    expect(outputs[0].batch.items).toBeUndefined()
    expect(outputs[1].batch).toMatchObject({
      carrier: 'property',
      logicalTopic: 'demo',
      count: 3,
      items: ['first', '', 'last'],
    })
    expect(outputs[2].batch).toMatchObject({
      carrier: 'topic',
      logicalTopic: 'demo',
      count: 3,
      items: ['first', '', 'last'],
    })
    expect(outputs[3].batch).toBeUndefined()
    expect(readFileSync(file, 'utf8')).toBe('first||last|first||last|after-batch|')
    expect(acknowledgements()).toBe(4)
  })

  it('saves the raw envelope even when decoding fails', async () => {
    const { port, payload } = await sequenceBroker()
    const saved = join(broker.directory, 'envelope.bin')
    const saveSub = launch(port, ['sub', '-b', '-t', 'demo', '--file-save', saved])
    await saveSub.until('after-batch')
    saveSub.child.kill('SIGINT')
    await saveSub.closed
    expect(readFileSync(saved)).toEqual(Buffer.from('000166000267', 'hex'))
    expect(readFileSync(join(broker.directory, 'envelope(1).bin'))).toEqual(payload)
    expect(readFileSync(join(broker.directory, 'envelope(2).bin'))).toEqual(payload)
  })

  it('keeps ordinary clean output unchanged without -b', async () => {
    const { port } = await sequenceBroker()
    const plainSub = launch(port, ['sub', '-t', 'demo', '--output-mode', 'clean'])
    await plainSub.until('after-batch')
    plainSub.child.kill('SIGINT')
    expect((await plainSub.closed).stdout).not.toContain('"batch":')
  })

  it('warns once without rewriting MQTT 3.1.1 filters', async () => {
    const warningPort = await listen(4, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket, 4)
      if (packet.cmd === 'subscribe')
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: packet.subscriptions.map(() => 1) }, 4)
    })
    const warned = launch(warningPort, ['sub', '-V', '3.1.1', '-b', '-t', 'demo', 'other'])
    await warned.until('Subscribed to other')
    warned.child.kill('SIGINT')
    expect((await warned.closed).output.match(/Note: MQTT 3.1.1 batches arrive/g)).toHaveLength(1)
  })
})
