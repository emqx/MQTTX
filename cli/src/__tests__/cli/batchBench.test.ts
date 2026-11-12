/// <reference path="../../types/global.d.ts" />
import { IPublishPacket } from 'mqtt-packet'
import { Commander } from '../../index'
import { benchLog } from '../../utils/logWrapper'
import { createBatchBroker } from '../helpers/batchBroker'

jest.setTimeout(60000)

describe('batch benchmarks', () => {
  const broker = createBatchBroker()
  const { listen, write, connack, launch, items, publication } = broker

  it.each([
    { failed: 0, ordinary: 0, expected: 'Received total: 10 items (2 batch packets)' },
    { failed: 1, ordinary: 0, expected: 'Received total: 10 items (2 batch packets), failed: 1 packets' },
    { failed: 0, ordinary: 2, expected: 'Received total: 10 items (2 batch packets), ordinary: 2 packets' },
  ])('hides zero counters with failed=$failed and ordinary=$ordinary', ({ failed, ordinary, expected }) => {
    const log = benchLog.receive(true)
    const counts = { total: 10, packets: 2, failed, ordinary }

    expect([log.summary(counts), log.rate(counts, 30)]).toEqual([expected, `${expected}, rate: 30 items/s`])
  })

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
        write(socket, publication('demo', publications[0].payload, { properties: publications[0].properties }))
        write(socket, publication('demo', Buffer.from('0002ff', 'hex'), { count: 1 }))
        write(socket, publication('demo', 'ordinary'))
      }
    })

    return { port, publications }
  }

  it('counts -L in packets and reports successful items and failures', async () => {
    const { port, publications } = await benchmarkBroker()
    const published = await launch(port, 'bench pub -b -bi 101 -S 1KB -c 1 -im 1 -L 3 -q 1 -t demo -v'.split(' '))
      .closed
    expect(published.code).toBe(1)
    expect(publications).toHaveLength(3)
    expect(publications[0].payload.length).toBeGreaterThan(65536)
    expect(items(publications[0])).toHaveLength(101)
    expect(items(publications[0])![0]).toBe(items(publications[0])![100])
    expect(published.output).toContain('Published total: 202 items (2 packets), failed: 1 packets')
  })

  it('defaults to 256 items per packet', async () => {
    const { port, publications } = await benchmarkBroker()
    const defaults = await launch(port, 'bench pub -b -c 1 -im 1 -L 1 -q 1 -t demo -m template'.split(' ')).closed
    expect(defaults.code).toBe(0)
    expect(publications).toHaveLength(1)
    expect(items(publications[0])).toEqual(Array(256).fill('template'))
    expect(defaults.output).toContain('Published total: 256 items (1 packets), failed: 0 packets')
  })

  it('counts items, rejected batches and ordinary messages separately', async () => {
    const { port, publications } = await benchmarkBroker()
    publications.push(publication('demo', Array(101).fill(Buffer.alloc(1024))))
    const subscribed = launch(port, 'bench sub -b -c 1 -t demo -v'.split(' '))
    await subscribed.until('Received total: 101 items (1 batch packets), failed: 1 packets, ordinary: 1 packets')
    const result = await broker.stop(subscribed, 'SIGINT')
    expect(result.code).toBe(130)
    expect(result.output).toContain('Received total: 101 items')
  })

  it('shows the bench batch default and -bi requirement', () => {
    const commander = new Commander()
    commander.init()
    const benchPub = commander.program.commands
      .find((command) => command.name() === 'bench')!
      .commands.find((command) => command.name() === 'pub')!
    benchPub.parseOptions(['-b', '-bi', '101'])
    expect(benchPub.opts()).toMatchObject({ batch: true, batchItems: 101 })
    const help = benchPub.helpInformation()
    expect(help).toContain('-b, --batch')
    expect(help).toContain('batches of 256 items by default')
    expect(help).toContain('requires -b')
  })
})
