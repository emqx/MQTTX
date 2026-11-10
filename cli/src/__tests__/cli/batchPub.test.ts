/// <reference path="../../types/global.d.ts" />
import { writeFileSync } from 'fs'
import { join } from 'path'
import { generate } from 'mqtt-packet'
import { createBatchBroker } from '../../../tests/helpers/batchBroker'

jest.setTimeout(60000)

describe('batch pub', () => {
  const broker = createBatchBroker()
  const { listen, write, connack, launch, publish, items } = broker

  it('does not report success after a negative PUBACK', async () => {
    let publications = 0
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'publish') {
        publications++
        write(socket, { cmd: 'puback', messageId: packet.messageId, reasonCode: 0x83 })
      }
    })
    const result = await launch(port, ['pub', '-b', '-q', '1', '-t', 'demo', '-m', 'test']).closed
    expect(result.code).toBe(1)
    expect(result.output).toContain('Publish error: Implementation specific error')
    expect(result.stdout).not.toContain('Message published')
    expect(result.output).not.toContain('Message published')
    expect(publications).toBe(1)
  })

  it('groups repeated messages without trimming or discarding empty items', async () => {
    const repeated = await publish(['-b', '-m', ' A ', '-m', '', '-m', 'B', '--batch-max-items', '2'])
    expect(repeated.code).toBe(0)
    expect(repeated.packets.map((packet) => items(packet))).toEqual([[' A ', ''], ['B']])
  })

  it('encodes each item before adding the topic carrier', async () => {
    const topicCarrier = await publish(['-b', '-m', '41', '-m', '', '-f', 'hex'], { version: 4 })
    expect(topicCarrier.code).toBe(0)
    expect(topicCarrier.packets[0].topic).toBe('$batch/2/demo/topic')
    expect(items(topicCarrier.packets[0], 4)).toEqual(['A', ''])
  })

  it('reads CRLF files with empty items', async () => {
    const file = join(broker.directory, 'items.txt')
    writeFileSync(file, ' a \r\n\r\nb\r\n')
    const fromFile = await publish(['-b', '--file-read', file])
    expect(items(fromFile.packets[0])).toEqual([' a ', '', 'b'])
  })

  it('reads piped input through /dev/stdin', async () => {
    const piped = await publish(['-b', '--file-read', '/dev/stdin'], { input: 'one\n\nthree\n' })
    expect(piped.code).toBe(0)
    expect(items(piped.packets[0])).toEqual(['one', '', 'three'])
  })

  it('splits files on a custom separator', async () => {
    const file = join(broker.directory, 'items.txt')
    writeFileSync(file, 'a::b::::')
    expect(items((await publish(['-b', '--file-read', file, '--split', '::'])).packets[0])).toEqual(['a', 'b', ''])
  })

  it('publishes many QoS 0 packets without growing the call stack', async () => {
    const file = join(broker.directory, 'items.txt')
    writeFileSync(file, '\n'.repeat(2000))
    const many = await publish(['-b', '--file-read', file, '--batch-max-items', '1', '-q', '0'], { version: 4 })
    expect(many.code).toBe(0)
    expect(many.packets).toHaveLength(2000)
  })

  it('splits before the next item exceeds the byte budget', async () => {
    const bytes = await publish(['-b', '-m', 'x'.repeat(1022), '-m', '', '--batch-max-bytes', '1024'])
    expect(bytes.code).toBe(0)
    expect(bytes.packets.map((packet) => packet.payload.length)).toEqual([1024, 2])
  })

  it('rejects an item above the byte budget before connecting', async () => {
    const tooBig = await publish(['-b', '-m', 'x'.repeat(1023), '--batch-max-bytes', '1024'])
    expect(tooBig.code).toBe(1)
    expect(tooBig.packets).toHaveLength(0)
    expect(tooBig.output).toContain('Batch input error: item 1')
  })

  it('uses the last repeated message outside batch mode', async () => {
    expect((await publish(['-m', 'first', '-m', 'last'])).packets.map((packet) => packet.payload.toString())).toEqual([
      'last',
    ])
  })

  it('reads the whole file outside batch mode', async () => {
    const file = join(broker.directory, 'items.txt')
    writeFileSync(file, 'a::b::::')
    expect((await publish(['--file-read', file])).packets[0].payload.toString()).toBe('a::b::::')
  })

  it('allows a manually framed topic outside batch mode', async () => {
    const manual = await publish(['-t', '$batch/1/demo', '-m', '000141', '-f', 'hex'])
    expect(manual.code).toBe(0)
    expect(manual.packets[0].payload).toEqual(Buffer.from('000141', 'hex'))
  })

  it('offers and selects v1 negotiation', async () => {
    const selected = await publish(['-b', '-m', 'x', '--batch-negotiate'], {
      properties: { userProperties: { 'batch-publish': 'v1' } },
    })
    expect(selected.code).toBe(0)
    expect(selected.offers).toEqual([{ 'batch-publish': 'v1' }])
  })

  it.each([undefined, 'unknown', ['v1', 'v1'], ['v1', 'unknown']])(
    'rejects unselected capability %p before publishing',
    async (selection) => {
      const declined = await publish(['-b', '--batch-negotiate'], {
        properties: selection === undefined ? undefined : { userProperties: { 'batch-publish': selection } },
      })
      expect(declined.code).toBe(1)
      expect(declined.packets).toHaveLength(0)
      expect(declined.output).toContain('Batch negotiation failed:')
    },
  )

  it('honors the broker Maximum Packet Size boundary', async () => {
    const selected = await publish(['-b', '-m', 'x'])
    const size = generate(selected.packets[0], { protocolVersion: 5 }).length
    expect((await publish(['-b', '-m', 'x'], { properties: { maximumPacketSize: size } })).code).toBe(0)
    const over = await publish(['-b', '-m', 'x'], { properties: { maximumPacketSize: size - 1 } })
    expect(over.code).toBe(1)
    expect(over.packets).toHaveLength(0)
    expect(over.output).toContain('Batch packet too large:')
  })

  it('explains prefixed logical topics before connecting', async () => {
    const prefix = await publish(['-b', '-t', '$batch/2/demo/topic'])
    expect(prefix.code).toBe(1)
    expect(prefix.output).toContain('Try: -t demo/topic')
    expect(prefix.offers).toHaveLength(0)
  })

  it('rejects interactive input in batch mode', async () => {
    const stdinConflict = await publish(['-b', '-s', '-M'])
    expect(stdinConflict.code).toBe(1)
    expect(stdinConflict.output).toContain('-b reads items from -m or --file-read (one per line).')
  })

  it('rejects a resumed session before MQTT.js retransmits an unselected batch', async () => {
    let connects = 0
    let resumedPublications = 0
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') {
        connects++
        connack(socket, 5, connects === 1 ? { userProperties: { 'batch-publish': 'v1' } } : undefined, connects > 1)
      } else if (packet.cmd === 'publish') {
        resumedPublications++
        socket.destroy()
      }
    })
    const resumed = await launch(port, [
      'pub',
      '-b',
      '--batch-negotiate',
      '--no-clean',
      '-rp',
      '10',
      '-t',
      'demo',
      '-q',
      '1',
      '-m',
      'x',
    ]).closed
    expect(resumed.code).toBe(1)
    expect(resumed.output).toContain('Batch session resume failed: v1 capability was not reselected.')
    expect(connects).toBe(2)
    expect(resumedPublications).toBe(1)
  })
})
