/// <reference path="../../types/global.d.ts" />
import { readFileSync } from 'fs'
import { join } from 'path'
import { encodeBatchPayload } from '../../utils/batchPublishing'
import { createBatchBroker } from '../helpers/batchBroker'

jest.setTimeout(60000)

describe('batch sub', () => {
  const broker = createBatchBroker()
  const { listen, write, connack, launch, publication } = broker

  const quoteBroker = async () => {
    const messages = ['{"id":"device-001","temp":23.1}', 'a\nb\rc\t\0\u001b', 'C:\\data\\device\\n', 'say "hello"']
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'subscribe') {
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: [0] })
        write(
          socket,
          publication(
            'demo',
            messages.map((message) => Buffer.from(message)),
          ),
        )
      }
    })

    return { port, messages }
  }

  it('keeps quotes and backslashes while escaping controls on one line', async () => {
    const { port } = await quoteBroker()
    const subscriber = launch(port, ['sub', '-b', '-t', 'demo'])
    await subscriber.until('[4]')
    const result = await broker.stop(subscriber, 'SIGINT')
    expect(result.stdout.split(/\r?\n/).filter((line) => /^\[\d+\]/.test(line))).toEqual([
      '[1]  {"id":"device-001","temp":23.1}',
      '[2]  a\\nb\\rc\\u0009\\u0000\\u001b',
      '[3]  C:\\data\\device\\n',
      '[4]  say "hello"',
    ])
  })

  it('keeps item text in clean JSON', async () => {
    const { port, messages } = await quoteBroker()
    const clean = launch(port, 'sub -b -t demo --output-mode clean'.split(' '))
    await clean.until('"batch":')
    const output = JSON.parse((await broker.stop(clean, 'SIGINT')).stdout)
    expect(output.batch.items).toEqual(messages)
    expect(output).not.toHaveProperty('payload')
  })

  const sequenceBroker = async (messages = [Buffer.from('first'), Buffer.alloc(0), Buffer.from('last')]) => {
    const payload = encodeBatchPayload(messages)
    let acknowledgements = 0
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'subscribe') {
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: [1] })
        write(socket, publication('demo', Buffer.from('000166000267', 'hex'), { qos: 1, messageId: 1, count: 2 }))
        write(socket, publication('demo', payload, { qos: 1, messageId: 2, count: 3 }))
        write(socket, publication('$batch/3/demo', payload, { qos: 1, messageId: 3 }))
        write(socket, publication('demo', 'after-batch', { qos: 1, messageId: 4 }))
      }
      if (packet.cmd === 'puback') acknowledgements++
    })

    return { port, payload, acknowledgements: () => acknowledgements }
  }

  it('prints batch details once and skips headers for rejected batches', async () => {
    const { port } = await sequenceBroker()
    const subscriber = launch(port, 'sub -b -t demo'.split(' '))
    await subscriber.until('after-batch')
    await broker.stop(subscriber)

    const topicHeader = subscriber.stdout.split('\n').find((line) => line.includes('topic: $batch/3/demo'))
    expect(topicHeader).toContain('size: 15B, batch: 3 items, logical_topic: demo')
    expect(subscriber.stdout).not.toMatch(/Batch ×|Wire topic:/)
    expect(subscriber.stdout.match(/received_at:/g)).toHaveLength(3)
  })

  it('receives 256 items by default', async () => {
    const messages = Array(256).fill(Buffer.from('item'))
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'subscribe') {
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: [0] })
        write(socket, publication('demo', messages))
      }
    })
    const subscriber = launch(port, 'sub -b -t demo --output-mode clean'.split(' '))
    await subscriber.until('"batch":')
    await broker.stop(subscriber)

    expect(JSON.parse(subscriber.stdout).batch.items).toEqual(Array(256).fill('item'))
  })

  it('rejects whole batches and keeps reading items on demo and $batch', async () => {
    const { port, acknowledgements } = await sequenceBroker()
    const file = join(broker.directory, 'items.out')
    const sub = launch(port, [
      ...'sub -b -t demo --output-mode clean --file-write'.split(' '),
      file,
      '--delimiter',
      '|',
    ])
    await sub.until('after-batch')
    const result = await broker.stop(sub, 'SIGINT')
    const outputs = JSON.parse(`[${result.stdout.trim().replace(/}\s*{/g, '},{')}]`)
    expect(outputs).toHaveLength(4)
    expect(outputs[0].batch.error).toBe('TRUNCATED_ITEM')
    expect(outputs[0].batch.items).toBeUndefined()
    expect(outputs[0]).toMatchObject({
      payload: '000166000267',
      batch: { rawPreviewEncoding: 'hex', rawPreviewBytes: 6, rawPreviewTruncated: false },
    })
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

  it('saves raw batch bytes when decoding fails', async () => {
    const { port, payload } = await sequenceBroker()
    const saved = join(broker.directory, 'envelope.bin')
    const saveSub = launch(port, ['sub', '-b', '-t', 'demo', '--file-save', saved])
    await saveSub.until('after-batch')
    await broker.stop(saveSub, 'SIGINT')
    expect(saveSub.stdout).toContain(`Saved to file: ${saved}`)
    expect(readFileSync(saved)).toEqual(Buffer.from('000166000267', 'hex'))
    expect(readFileSync(join(broker.directory, 'envelope(1).bin'))).toEqual(payload)
    expect(readFileSync(join(broker.directory, 'envelope(2).bin'))).toEqual(payload)
  })

  it('appends binary items and delimiters from both topic forms', async () => {
    const first = Buffer.from([0xff, 0x80])
    const last = Buffer.from([0x00, 0xc3])
    const { port, acknowledgements } = await sequenceBroker([first, Buffer.alloc(0), last])
    const file = join(broker.directory, 'binary.out')
    const subscriber = launch(port, [
      ...'sub -b -t demo -f binary --output-mode clean --file-write'.split(' '),
      file,
      '--delimiter',
      '|',
    ])
    await subscriber.until(() => acknowledgements() === 4, 'all four acknowledgements')
    await broker.stop(subscriber)

    const envelopeItems = Buffer.concat([first, Buffer.from('||'), last, Buffer.from('|')])
    expect(readFileSync(file)).toEqual(Buffer.concat([envelopeItems, envelopeItems, Buffer.from('after-batch|')]))
  })

  it('omits batch fields from clean output without -b', async () => {
    const { port } = await sequenceBroker()
    const plainSub = launch(port, ['sub', '-t', 'demo', '--output-mode', 'clean'])
    await plainSub.until('after-batch')
    expect((await broker.stop(plainSub, 'SIGINT')).stdout).not.toContain('"batch":')
  })

  it('warns once without rewriting MQTT 3.1.1 filters', async () => {
    const warningPort = await listen(4, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket, 4)
      if (packet.cmd === 'subscribe')
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: packet.subscriptions.map(() => 1) }, 4)
    })
    const warned = launch(warningPort, 'sub -V 3.1.1 -b -t demo other'.split(' '))
    await warned.until('Subscribed to other')
    expect((await broker.stop(warned, 'SIGINT')).output.match(/Note: MQTT 3.1.1 batches arrive/g)).toHaveLength(1)
  })
})
