/**
 * Set FLOWMQ_HOST and FLOWMQ_PORT to opt in; otherwise this suite is skipped.
 * Requires FlowMQ with these batch routes (property, negotiation, and topic carriers):
 * [
 *   {"tenant": "plant", "logical_topic": "demo/batch", "carrier": "property",
 *    "packets_per_second": 1000, "bytes_per_second": 1048576, "items_per_second": 10000},
 *   {"tenant": "plant", "logical_topic": "demo/nego", "carrier": "property", "mode": "batch-only",
 *    "require_negotiation": true,
 *    "packets_per_second": 1000, "bytes_per_second": 1048576, "items_per_second": 10000},
 *   {"tenant": "plant", "logical_topic": "demo/topic",
 *    "packets_per_second": 1000, "bytes_per_second": 1048576, "items_per_second": 10000}
 * ]
 * Run from cli/ after a Node 18 yarn build:
 * FLOWMQ_HOST=127.0.0.1 FLOWMQ_PORT=18883 FLOWMQ_CA='<path-to-ca.pem>' \
 * FLOWMQ_CERT='<path-to-client-cert.pem>' FLOWMQ_KEY='<path-to-client-key.pem>' \
 * FLOWMQ_USERNAME='<username>' FLOWMQ_PASSWORD='<password>' \
 * npx jest src/__tests__/cli/batchFlowmq.test.ts
 */
import { randomBytes } from 'crypto'
import { createCli, CliProcess } from '../../../tests/helpers/cli'

const environment = { ...process.env }
const { FLOWMQ_HOST, FLOWMQ_PORT, FLOWMQ_CA, FLOWMQ_CERT, FLOWMQ_KEY, FLOWMQ_USERNAME, FLOWMQ_PASSWORD } = environment

jest.setTimeout(60000)

interface ReceivedMessage {
  topic: string
  payload: string
  packet: { properties?: { userProperties?: Record<string, string | string[]> } }
  batch?: { carrier: string; logicalTopic: string; count: number; items: string[] }
}

const describeFlowmq = FLOWMQ_HOST && FLOWMQ_PORT ? describe : describe.skip

describeFlowmq('batch publishing with FlowMQ', () => {
  const cli = createCli()
  let token: string
  const connectionArgs = ['-h', FLOWMQ_HOST || '', '-p', FLOWMQ_PORT || '', '-rp', '0']
  if (FLOWMQ_CA || FLOWMQ_CERT || FLOWMQ_KEY) {
    connectionArgs.push('-l', 'mqtts')
  } else {
    connectionArgs.push('-l', 'mqtt')
  }
  for (const [flag, value] of [
    ['--ca', FLOWMQ_CA],
    ['--cert', FLOWMQ_CERT],
    ['--key', FLOWMQ_KEY],
    ['-u', FLOWMQ_USERNAME],
    ['-P', FLOWMQ_PASSWORD],
  ] as const) {
    if (value !== undefined) connectionArgs.push(flag, value)
  }

  beforeEach(() => {
    token = `flowmq-${randomBytes(8).toString('hex')}`
  })

  const launch = (args: string[]) => cli.launch([...args, ...connectionArgs], { env: environment })

  const records = (subscriber: CliProcess): ReceivedMessage[] => {
    if (!subscriber.stdout.trim()) return []
    try {
      return JSON.parse(`[${subscriber.stdout.trim().replace(/}\s*{/g, '},{')}]`)
    } catch {
      // The latest pretty-printed JSON object may still be arriving.
      return []
    }
  }

  const subscribe = async (args: string[]) => {
    const subscriber = launch(['sub', '-q', '1', '--output-mode', 'clean', '--debug', ...args])
    // Clean mode hides connection logs; debug confirms SUBACK without changing stdout.
    await subscriber.until('_handleAck :: packet type suback')
    return subscriber
  }

  const publish = (args: string[]) => launch(['pub', '-V', '5', '-q', '1', '-t', 'demo/batch', '-b', ...args]).closed

  const receiveBatches = async (subscriber: CliProcess, packets: number) => {
    const matching = () =>
      records(subscriber).filter((message) => message.batch?.items.some((item) => item.includes(token)))
    await subscriber.until(() => matching().length >= packets, `${packets} decoded batches`)
    await cli.stop(subscriber)
    return matching().map((message) => message.batch!)
  }

  it('receives four property-carrier items in two packets with --batch-max-items 2', async () => {
    const subscriber = await subscribe(['-V', '5', '-b', '-t', 'demo/batch'])
    const messages = Array.from({ length: 4 }, (_, index) => `${token}-${index}`)
    expect((await publish(['--batch-max-items', '2', ...messages.flatMap((message) => ['-m', message])])).code).toBe(0)
    const batches = await receiveBatches(subscriber, 2)
    expect(batches.map((batch) => [batch.carrier, batch.logicalTopic, batch.count])).toEqual([
      ['property', 'demo/batch', 2],
      ['property', 'demo/batch', 2],
    ])
    expect(batches.map((batch) => batch.items)).toEqual([messages.slice(0, 2), messages.slice(2)])
  })

  it('decodes MQTT 3.1.1 topic-carrier items and the logical topic', async () => {
    const subscriber = await subscribe(['-V', '3.1.1', '-b', '-t', '$batch/+/demo/topic'])
    const messages = [`${token}-first`, `${token}-second`]
    expect((await publish(['-V', '3.1.1', '-t', 'demo/topic', '-m', messages[0], '-m', messages[1]])).code).toBe(0)
    expect(await receiveBatches(subscriber, 1)).toEqual([
      { carrier: 'topic', logicalTopic: 'demo/topic', count: 2, items: messages },
    ])
    expect(records(subscriber).find((message) => message.batch?.items.includes(messages[0]))?.topic).toBe(
      '$batch/2/demo/topic',
    )
  })

  it('exposes the raw length-prefixed envelope and user properties without -b', async () => {
    const subscriber = await subscribe('-V 5 -t demo/batch -f hex'.split(' '))
    const messages = [`${token}-first`, `${token}-second`]
    const hex = messages
      .map((message) => Buffer.byteLength(message).toString(16).padStart(4, '0') + Buffer.from(message).toString('hex'))
      .join('')
    expect((await publish(['-m', messages[0], '-m', messages[1]])).code).toBe(0)
    const matching = () => records(subscriber).filter((message) => message.payload.replace(/\s/g, '') === hex)
    await subscriber.until(() => matching().length > 0, 'raw batch envelope')
    await cli.stop(subscriber)
    expect(matching()).toHaveLength(1)
    expect(matching()[0].batch).toBeUndefined()
    expect(matching()[0].packet.properties?.userProperties).toMatchObject({ 'batch-format': 'v1', 'batch-size': '2' })
    expect(matching()[0].payload.replace(/\s/g, '')).toBe(hex)
  })

  it('requires negotiation before publishing on demo/nego', async () => {
    const subscriber = await subscribe(['-V', '5', '-b', '-t', 'demo/nego'])
    const declined = `${token}-declined`
    const accepted = `${token}-accepted`
    const rejected = await publish(['-t', 'demo/nego', '-m', declined])
    expect(rejected.code).toBe(1)
    expect(rejected.output).not.toContain('Message published')
    const selected = await publish(['-t', 'demo/nego', '-m', accepted, '--batch-negotiate'])
    expect(selected.code).toBe(0)
    expect(selected.output).toContain('Batch negotiation selected: v1')
    expect(await receiveBatches(subscriber, 1)).toEqual([
      { carrier: 'property', logicalTopic: 'demo/nego', count: 1, items: [accepted] },
    ])
  })

  it('publishes 500 benchmark items with an explicit 100-item packet size', async () => {
    const subscriber = await subscribe(['-V', '5', '-b', '-t', 'demo/batch'])
    const result = await launch([
      ...'bench pub -V 5 -q 1 -t demo/batch -b -bi 100 -L 5 -im 100 -c 1 -m'.split(' '),
      token,
    ]).closed
    expect(result.code).toBe(0)
    expect(result.output).toContain('Published total: 500 items (5 packets), failed: 0 packets')
    const batches = await receiveBatches(subscriber, 5)
    expect(batches.map((batch) => batch.count)).toEqual([100, 100, 100, 100, 100])
    expect(batches.flatMap((batch) => batch.items)).toEqual(Array(500).fill(token))
  })
})
