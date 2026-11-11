/// <reference path="../../types/global.d.ts" />
import { writeFileSync } from 'fs'
import { join } from 'path'
import { generate } from 'mqtt-packet'
import { Commander } from '../../index'
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
    const result = await launch(port, 'pub -b -q 1 -t demo -m test'.split(' ')).closed
    expect(result.code).toBe(1)
    expect(result.output).toContain('Publish error: Implementation specific error')
    expect(result.stdout).not.toContain('Published 1 item in 1 batch')
    expect(result.output).not.toContain('Published 1 item in 1 batch')
    expect(publications).toBe(1)
  })

  it('groups repeated messages without trimming or discarding empty items', async () => {
    const repeated = await publish(['-b', '-m', ' A ', '-m', '', '-m', 'B', '--batch-max-items', '2'])
    expect(repeated.code).toBe(0)
    expect(repeated.packets.map((packet) => items(packet))).toEqual([[' A ', ''], ['B']])
    expect(repeated.output).toContain('Published 3 items in 2 batches')
  })

  it('encodes each item before adding the topic carrier', async () => {
    const topicCarrier = await publish(['-b', '-m', '41', '-m', '', '-f', 'hex'], { version: 4 })
    expect(topicCarrier.code).toBe(0)
    expect(topicCarrier.packets[0].topic).toBe('$batch/2/demo/topic')
    expect(items(topicCarrier.packets[0], 4)).toEqual(['A', ''])
  })

  const itemsFile = (content: string) => {
    const file = join(broker.directory, 'items.txt')
    writeFileSync(file, content)
    return file
  }

  it('defaults to 256 items per packet', async () => {
    const file = itemsFile('item\n'.repeat(257))
    const result = await publish(['-b', '--file-read', file])

    expect(result.code).toBe(0)
    expect(result.packets.map((packet) => items(packet)?.length)).toEqual([256, 1])
  })

  it.each(['pub', 'sub'])('shows the 256-item default and unchanged byte limit in %s help', (name) => {
    const commander = new Commander()
    commander.init()
    const command = commander.program.commands.find((command) => command.name() === name)!
    command.parseOptions([])

    expect(command.opts()).toMatchObject({ batchMaxItems: 256, batchMaxBytes: 65536 })
    expect(command.helpInformation()).toContain('default: 256')
  })

  it('reads CRLF files with empty items', async () => {
    const file = itemsFile(' a \r\n\r\nb\r\n')
    const fromFile = await publish(['-b', '--file-read', file])
    expect(items(fromFile.packets[0])).toEqual([' a ', '', 'b'])
  })

  it('reads piped input through /dev/stdin', async () => {
    const piped = await publish(['-b', '--file-read', '/dev/stdin'], { input: 'one\n\nthree\n' })
    expect(piped.code).toBe(0)
    expect(items(piped.packets[0])).toEqual(['one', '', 'three'])
  })

  it('splits files on a custom separator', async () => {
    const file = itemsFile('a::b::::')
    expect(items((await publish(['-b', '--file-read', file, '--split', '::'])).packets[0])).toEqual(['a', 'b', ''])
  })

  it('publishes many QoS 0 packets without growing the call stack', async () => {
    const file = itemsFile('\n'.repeat(2000))
    const many = await publish(['-b', '--file-read', file, '--batch-max-items', '1', '-q', '0'], { version: 4 })
    expect(many.code).toBe(0)
    expect(many.packets).toHaveLength(2000)
    expect(many.output.match(/Message publishing\.\.\./g)).toHaveLength(1)
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
    expect(tooBig.output).toContain('Item 1 is 1023 B; a batch item can be at most 1022 B with --batch-max-bytes 1024')
    expect(tooBig.output).not.toContain('Error:')
  })

  it('names the length-prefix limit when the payload budget is larger', async () => {
    const file = itemsFile('x'.repeat(70000))
    const result = await publish(['-b', '--file-read', file, '--batch-max-bytes', '1048576'])

    expect(result.code).toBe(1)
    expect(result.packets).toHaveLength(0)
    expect(result.output).toContain(
      'Item 1 is 70000 B; a batch item can be at most 65535 B with the 2-byte item length prefix',
    )
    expect(result.output).not.toContain('Error:')
  })

  it('uses the last repeated message outside batch mode', async () => {
    expect((await publish(['-m', 'first', '-m', 'last'])).packets.map((packet) => packet.payload.toString())).toEqual([
      'last',
    ])
  })

  it('reads the whole file outside batch mode', async () => {
    const file = itemsFile('a::b::::')
    expect((await publish(['--file-read', file])).packets[0].payload.toString()).toBe('a::b::::')
  })

  it('allows a manually framed topic outside batch mode', async () => {
    const manual = await publish('-t $batch/1/demo -m 000141 -f hex'.split(' '))
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

  it('rejects an unselected capability before publishing', async () => {
    const declined = await publish(['-b', '--batch-negotiate'])
    expect(declined.code).toBe(1)
    expect(declined.packets).toHaveLength(0)
    expect(declined.output).toContain('Batch negotiation failed:')
  })

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
    const resumed = await launch(port, 'pub -b --batch-negotiate --no-clean -rp 10 -t demo -q 1 -m x'.split(' ')).closed
    expect(resumed.code).toBe(1)
    expect(resumed.output).toContain('Batch session resume failed: v1 capability was not reselected.')
    expect(connects).toBe(2)
    expect(resumedPublications).toBe(1)
  })
})
