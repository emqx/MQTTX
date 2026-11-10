/// <reference path="../../types/global.d.ts" />
import { IPublishPacket } from 'mqtt-packet'
import { encodeBatchPayload } from '../../utils/batchPublishing'
import { Commander } from '../../index'
import { createBatchBroker } from '../../../tests/helpers/batchBroker'

jest.setTimeout(60000)

describe('batch benchmarks', () => {
  const broker = createBatchBroker()
  const { listen, write, connack, launch, items } = broker

  const benchmarkBroker = async () => {
    const publications: IPublishPacket[] = []
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'publish') {
        publications.push(packet)
        write(socket, { cmd: 'puback', messageId: packet.messageId, reasonCode: publications.length === 2 ? 0x83 : 0 })
      }
      if (packet.cmd === 'subscribe') {
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: [1] })
        write(socket, {
          cmd: 'publish',
          topic: 'demo',
          qos: 0,
          retain: false,
          dup: false,
          payload: publications[0].payload,
          properties: publications[0].properties,
        })
        write(socket, {
          cmd: 'publish',
          topic: 'demo',
          qos: 0,
          retain: false,
          dup: false,
          payload: Buffer.from('0002ff', 'hex'),
          properties: { userProperties: { 'batch-format': 'v1', 'batch-size': '1' } },
        })
        write(socket, {
          cmd: 'publish',
          topic: 'demo',
          qos: 0,
          retain: false,
          dup: false,
          payload: Buffer.from('ordinary'),
        })
      }
    })

    return { port, publications }
  }

  it('counts -L packets and successful items separately from failed acknowledgements', async () => {
    const { port, publications } = await benchmarkBroker()
    const published = await launch(port, [
      'bench',
      'pub',
      '-b',
      '-bi',
      '101',
      '-S',
      '1KB',
      '-c',
      '1',
      '-im',
      '1',
      '-L',
      '3',
      '-q',
      '1',
      '-t',
      'demo',
      '-v',
    ]).closed
    expect(published.code).toBe(1)
    expect(publications).toHaveLength(3)
    expect(publications[0].payload.length).toBeGreaterThan(65536)
    expect(items(publications[0])).toHaveLength(101)
    expect(items(publications[0])![0]).toBe(items(publications[0])![100])
    expect(published.output).toContain('Published total: 202 items (2 packets), failed: 1 packets')
  })

  it('requires -b before accepting a batch item count', async () => {
    const { port, publications } = await benchmarkBroker()
    const standaloneItems = await launch(port, ['bench', 'pub', '-bi', '2', '-c', '1', '-L', '1', '-t', 'demo']).closed
    expect(standaloneItems.code).toBe(1)
    expect(standaloneItems.output).toContain('-bi requires -b.')
    expect(publications).toHaveLength(0)
  })

  it('defaults to 100 items per packet', async () => {
    const { port, publications } = await benchmarkBroker()
    const defaults = await launch(port, [
      'bench',
      'pub',
      '-b',
      '-c',
      '1',
      '-im',
      '1',
      '-L',
      '1',
      '-q',
      '1',
      '-t',
      'demo',
      '-m',
      'template',
    ]).closed
    expect(defaults.code).toBe(0)
    expect(publications).toHaveLength(1)
    expect(items(publications[0])).toEqual(Array(100).fill('template'))
    expect(defaults.output).toContain('Published total: 100 items (1 packets), failed: 0 packets')
  })

  it('counts received items, failed batches, and ordinary packets separately', async () => {
    const { port, publications } = await benchmarkBroker()
    publications.push({
      cmd: 'publish',
      topic: 'demo',
      qos: 0,
      retain: false,
      dup: false,
      payload: encodeBatchPayload(Array(101).fill(Buffer.alloc(1024)), { maxItems: 101, maxBytes: 1048576 }),
      properties: { userProperties: { 'batch-format': 'v1', 'batch-size': '101' } },
    })
    const subscribed = launch(port, ['bench', 'sub', '-b', '-c', '1', '-t', 'demo', '-v'])
    await subscribed.until('Received total: 101 items (1 batch packets), failed: 1 packets, ordinary: 1 packets')
    subscribed.child.kill('SIGINT')
    const result = await subscribed.closed
    expect(result.code).toBe(130)
    expect(result.output).toContain('Received total: 101 items')
  })

  it('exposes bench -b and explains the default count and -bi requirement', () => {
    const commander = new Commander()
    commander.init()
    const benchPub = commander.program.commands
      .find((command) => command.name() === 'bench')!
      .commands.find((command) => command.name() === 'pub')!
    benchPub.parseOptions(['-b', '-bi', '101'])
    expect(benchPub.opts()).toMatchObject({ batch: true, batchItems: 101 })
    const help = benchPub.helpInformation()
    expect(help).toContain('-b, --batch')
    expect(help).toContain('100 items per packet by default')
    expect(help).toContain('requires -b')
  })
})
