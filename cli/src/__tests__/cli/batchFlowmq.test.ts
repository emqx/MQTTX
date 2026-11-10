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
import { ChildProcess, spawn } from 'child_process'
import { randomBytes } from 'crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const environment = { ...process.env }
const { FLOWMQ_HOST, FLOWMQ_PORT, FLOWMQ_CA, FLOWMQ_CERT, FLOWMQ_KEY, FLOWMQ_USERNAME, FLOWMQ_PASSWORD } = environment

jest.setTimeout(60000)

interface CliResult {
  code: number | null
  stdout: string
  output: string
}

interface CliProcess {
  child: ChildProcess
  closed: Promise<CliResult>
  output: () => string
  records: () => ReceivedMessage[]
  until: (condition: () => boolean, description: string) => Promise<void>
}

interface ReceivedMessage {
  topic: string
  payload: string
  packet: { properties?: { userProperties?: Record<string, string | string[]> } }
  batch?: { carrier: string; logicalTopic: string; count: number; items: string[] }
}

const describeFlowmq = FLOWMQ_HOST && FLOWMQ_PORT ? describe : describe.skip

describeFlowmq('batch publishing with FlowMQ', () => {
  const children: CliProcess[] = []
  let directory: string | undefined
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
    directory = mkdtempSync(join(tmpdir(), 'mqttx-cli-flowmq-batch-'))
    token = `flowmq-${randomBytes(8).toString('hex')}`
  })

  const stop = async (cli: CliProcess) => {
    if (cli.child.exitCode !== null || cli.child.signalCode !== null) return cli.closed
    cli.child.kill('SIGTERM')
    const timeout = setTimeout(() => cli.child.kill('SIGKILL'), 2000)
    try {
      return await cli.closed
    } finally {
      clearTimeout(timeout)
    }
  }

  const cleanup = async () => {
    await Promise.all(children.splice(0).map(stop))
    if (directory) {
      rmSync(directory, { recursive: true, force: true })
      directory = undefined
    }
  }

  afterEach(cleanup)
  afterAll(cleanup)

  const launch = (args: string[]): CliProcess => {
    const child = spawn(process.execPath, ['./bin/index.js', ...args, ...connectionArgs], {
      env: { ...environment, HOME: directory, USERPROFILE: directory },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let output = ''
    child.stdout!.on('data', (data) => {
      stdout += data
      output += data
    })
    child.stderr!.on('data', (data) => {
      output += data
    })
    child.on('error', (error) => {
      output += error.toString()
    })
    const closed = new Promise<CliResult>((resolve) => {
      child.once('close', (code) => resolve({ code, stdout, output }))
    })
    const records = (): ReceivedMessage[] => {
      if (!stdout.trim()) return []
      try {
        return JSON.parse(`[${stdout.trim().replace(/}\s*{/g, '},{')}]`)
      } catch {
        // The latest pretty-printed JSON object may still be arriving.
        return []
      }
    }
    const until = async (condition: () => boolean, description: string) => {
      const started = Date.now()
      while (!condition()) {
        if (Date.now() - started > 30000 || child.exitCode !== null || child.signalCode !== null) {
          throw new Error(`Timed out waiting for ${description}: ${output}`)
        }
        await new Promise((resolve) => setTimeout(resolve, 20))
      }
    }
    const cli = { child, closed, output: () => output, records, until }
    children.push(cli)
    return cli
  }

  const run = async (args: string[]) => {
    const cli = launch(args)
    await cli.until(() => cli.child.exitCode !== null || cli.child.signalCode !== null, 'CLI exit')
    return cli.closed
  }

  const subscribe = async (args: string[]) => {
    const subscriber = launch(['sub', '-q', '1', '--output-mode', 'clean', '--debug', ...args])
    // Clean mode hides connection logs; debug confirms SUBACK without changing stdout.
    await subscriber.until(() => subscriber.output().includes('_handleAck :: packet type suback'), 'SUBACK')
    return subscriber
  }

  const publish = (args: string[]) => run(['pub', '-V', '5', '-q', '1', '-t', 'demo/batch', '-b', ...args])

  const receiveBatches = async (subscriber: CliProcess, packets: number) => {
    const matching = () =>
      subscriber.records().filter((message) => message.batch?.items.some((item) => item.includes(token)))
    await subscriber.until(() => matching().length >= packets, `${packets} decoded batches`)
    await stop(subscriber)
    return matching().map((message) => message.batch!)
  }

  it('receives two repeated MQTT 5 messages in one property-carrier batch', async () => {
    const subscriber = await subscribe(['-V', '5', '-b', '-t', 'demo/batch'])
    const messages = [`${token}-first`, `${token}-second`]
    expect((await publish(['-m', messages[0], '-m', messages[1]])).code).toBe(0)
    expect(await receiveBatches(subscriber, 1)).toEqual([
      { carrier: 'property', logicalTopic: 'demo/batch', count: 2, items: messages },
    ])
  })

  it('reads CRLF files with an empty item and no extra trailing item', async () => {
    const subscriber = await subscribe(['-V', '5', '-b', '-t', 'demo/batch'])
    const messages = [`${token}-first`, '', `${token}-third`, `${token}-fourth`]
    const file = join(directory!, 'items.txt')
    writeFileSync(file, `${messages.join('\r\n')}\r\n`)
    expect((await publish(['--file-read', file])).code).toBe(0)
    const batches = await receiveBatches(subscriber, 1)
    expect(batches).toHaveLength(1)
    expect(batches[0]).toMatchObject({ count: 4, items: messages })
  })

  it('splits four items into two packets with --batch-max-items 2', async () => {
    const subscriber = await subscribe(['-V', '5', '-b', '-t', 'demo/batch'])
    const messages = Array.from({ length: 4 }, (_, index) => `${token}-${index}`)
    expect((await publish(['--batch-max-items', '2', ...messages.flatMap((message) => ['-m', message])])).code).toBe(0)
    const batches = await receiveBatches(subscriber, 2)
    expect(batches.map((batch) => batch.count)).toEqual([2, 2])
    expect(batches.map((batch) => batch.items)).toEqual([messages.slice(0, 2), messages.slice(2)])
  })

  it('decodes MQTT 3.1.1 topic-carrier items and the logical topic', async () => {
    const subscriber = await subscribe(['-V', '3.1.1', '-b', '-t', '$batch/+/demo/topic'])
    const messages = [`${token}-first`, `${token}-second`]
    expect((await publish(['-V', '3.1.1', '-t', 'demo/topic', '-m', messages[0], '-m', messages[1]])).code).toBe(0)
    expect(await receiveBatches(subscriber, 1)).toEqual([
      { carrier: 'topic', logicalTopic: 'demo/topic', count: 2, items: messages },
    ])
    expect(subscriber.records().find((message) => message.batch?.items.includes(messages[0]))?.topic).toBe(
      '$batch/2/demo/topic',
    )
  })

  it('exposes the raw length-prefixed envelope and user properties without -b', async () => {
    const subscriber = await subscribe(['-V', '5', '-t', 'demo/batch', '-f', 'hex'])
    const messages = [`${token}-first`, `${token}-second`]
    const hex = messages
      .map((message) => Buffer.byteLength(message).toString(16).padStart(4, '0') + Buffer.from(message).toString('hex'))
      .join('')
    expect((await publish(['-m', messages[0], '-m', messages[1]])).code).toBe(0)
    const matching = () => subscriber.records().filter((message) => message.payload.replace(/\s/g, '') === hex)
    await subscriber.until(() => matching().length > 0, 'raw batch envelope')
    await stop(subscriber)
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

  it('publishes 500 benchmark items in five packets', async () => {
    const subscriber = await subscribe(['-V', '5', '-b', '-t', 'demo/batch'])
    const result = await run([
      'bench',
      'pub',
      '-V',
      '5',
      '-q',
      '1',
      '-t',
      'demo/batch',
      '-b',
      '-L',
      '5',
      '-im',
      '100',
      '-c',
      '1',
      '-m',
      token,
    ])
    expect(result.code).toBe(0)
    expect(result.output).toContain('Published total: 500 items (5 packets), failed: 0 packets')
    const batches = await receiveBatches(subscriber, 5)
    expect(batches.map((batch) => batch.count)).toEqual([100, 100, 100, 100, 100])
    expect(batches.flatMap((batch) => batch.items)).toEqual(Array(500).fill(token))
  })
})
