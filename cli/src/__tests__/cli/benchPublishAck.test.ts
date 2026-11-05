import { ChildProcess, spawn } from 'child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { createServer, Server, Socket } from 'net'
import { tmpdir } from 'os'
import { join } from 'path'
import { generate, parser } from 'mqtt-packet'

jest.setTimeout(10000)

describe('benchmark publish acknowledgements', () => {
  const sockets = new Set<Socket>()
  let server: Server
  let child: ChildProcess | undefined
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-bench-ack-test-'))
  })

  afterEach(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const closed = new Promise((resolve) => child!.once('close', resolve))
      child.kill()
      await closed
    }
    sockets.forEach((socket) => socket.destroy())
    sockets.clear()
    if (server?.listening) await new Promise<void>((resolve) => server.close(() => resolve()))
    rmSync(directory, { recursive: true, force: true })
  })

  const run = async (
    args: string[],
    acks: { puback?: (index: number) => number; pubrec?: number; pubcomp?: number } = {},
    nodeArgs: string[] = [],
  ) => {
    const publications: string[] = []
    const publicationsByClient = new Map<string, string[]>()
    server = createServer((socket) => {
      const messages: string[] = []
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      const packets = parser({ protocolVersion: 5 })
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => {
        if (packet.cmd === 'connect') {
          publicationsByClient.set(packet.clientId, messages)
          socket.write(generate({ cmd: 'connack', reasonCode: 0, sessionPresent: false }, { protocolVersion: 5 }))
        } else if (packet.cmd === 'publish') {
          publications.push(packet.payload.toString())
          messages.push(packet.payload.toString())
          socket.write(
            generate(
              {
                cmd: packet.qos === 1 ? 'puback' : 'pubrec',
                messageId: packet.messageId!,
                reasonCode: packet.qos === 1 ? acks.puback?.(publications.length) ?? 0 : acks.pubrec ?? 0,
              },
              { protocolVersion: 5 },
            ),
          )
        } else if (packet.cmd === 'pubrel') {
          socket.write(
            generate(
              { cmd: 'pubcomp', messageId: packet.messageId, reasonCode: acks.pubcomp ?? 0 },
              { protocolVersion: 5 },
            ),
          )
        }
      })
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No test broker port')
    return new Promise<{
      code: number | null
      output: string
      publications: string[]
      publicationsByClient: Map<string, string[]>
    }>((resolve, reject) => {
      let output = ''
      child = spawn(process.execPath, [
        ...nodeArgs,
        'bin/index.js',
        'bench',
        'pub',
        ...args,
        '-h',
        '127.0.0.1',
        '-p',
        String(address.port),
        '-V',
        '5',
        '-i',
        '0',
        '-im',
        '1',
        '-I',
        'benchmark-ack',
        '-t',
        'test/bench',
        '-v',
      ])
      const timer = setTimeout(() => {
        child!.kill()
        reject(new Error(`Benchmark timed out after ${publications.length} publishes: ${output}`))
      }, 5000)
      child.stdout!.on('data', (data) => (output += data.toString()))
      child.stderr!.on('data', (data) => (output += data.toString()))
      child.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      child.once('close', (code) => {
        clearTimeout(timer)
        resolve({ code, output, publications, publicationsByClient })
      })
    })
  }

  it.each([1, 2])('counts rejected QoS %i final acknowledgements once and stops at the limit', async (qos) => {
    const limit = 100
    const result = await run(['-c', '10', '-q', String(qos), '-L', String(limit)], {
      puback: () => 0x80,
      pubcomp: 0x92,
    })
    expect(result.publications).toHaveLength(limit)
    expect(result.code).toBe(1)
    expect(result.output).toContain(`${limit} of ${limit} messages failed to publish.`)
  })

  it('counts mixed QoS 1 acknowledgements without exceeding the limit', async () => {
    const limit = 100
    const result = await run(['-c', '10', '-q', '1', '-L', String(limit)], {
      puback: (index) => (index % 2 === 0 ? 0x80 : 0),
    })
    expect(result.publications).toHaveLength(limit)
    expect(result.code).toBe(1)
    expect(result.output).toContain(`${limit / 2} of ${limit} messages failed to publish.`)
  })

  it('preserves successful QoS 1 limit completion', async () => {
    const limit = 100
    const result = await run(['-c', '10', '-q', '1', '-L', String(limit)])
    expect(result.publications).toHaveLength(limit)
    expect(result.code).toBe(0)
    expect(result.output).toContain(`All ${limit} messages have been sent, reaching the limit of ${limit}.`)
    expect(result.output).not.toContain('messages failed to publish.')
    expect(result.output).not.toContain('Waiting for acknowledgements: in-flight limit')
  })

  it.each(['\n', '::'])(
    'replays 200 split messages once in order for each of 3 QoS 1 clients with %j',
    async (delimiter) => {
      const messages = Array.from({ length: 200 }, (_, index) => `line ${index}`)
      const file = join(directory, 'messages.txt')
      writeFileSync(file, messages.join(delimiter))
      const preload = join(directory, 'split-reads.js')
      // Guard the shared array against mutation and eager per-client copies.
      writeFileSync(
        preload,
        `const fileUtils = require(${JSON.stringify(join(process.cwd(), 'dist/src/utils/fileUtils'))})
const mqttConnect = require(${JSON.stringify(join(process.cwd(), 'dist/src/utils/mqttConnect'))})
const split = fileUtils.fileDataSplitter
const connect = mqttConnect.createMqttClient
let reads = 0
fileUtils.fileDataSplitter = (...args) => new Proxy(Object.freeze(split(...args)), {
  get(target, key, receiver) {
    if (typeof key === 'string' && /^\\d+$/.test(key)) reads++
    return Reflect.get(target, key, receiver)
  },
})
mqttConnect.createMqttClient = (...args) => {
  if (reads > 0) throw new Error('Split lines read before all clients were created')
  return connect(...args)
}
process.on('exit', () => console.log('Split line reads: ' + reads))
`,
      )
      const result = await run(
        ['-c', '3', '-q', '1', '--file-read', file, '--split', ...(delimiter === '\n' ? [] : [delimiter])],
        {},
        ['--require', preload],
      )
      expect(result.output).not.toContain('Split lines read before all clients were created')
      expect(result.code).toBe(0)
      expect(result.publications).toHaveLength(messages.length * 3)
      expect(result.publicationsByClient.size).toBe(3)
      result.publicationsByClient.forEach((received) => expect(received).toEqual(messages))
      expect(result.output).toContain(
        `All ${messages.length * 3} messages from the ${file} have been successfully sent.`,
      )
      expect(result.output).toContain(`Split line reads: ${messages.length * 3}`)
      expect(result.output).not.toContain('messages failed to publish.')
    },
  )

  it.each([0x80, 0])('finishes QoS 2 split replay with PUBREC reason code %i', async (reasonCode) => {
    const messages = ['one', 'two', 'three', 'four']
    const file = join(directory, 'messages.txt')
    writeFileSync(file, messages.join('\n'))
    const result = await run(['-c', '1', '-q', '2', '--file-read', file, '--split'], { pubrec: reasonCode })
    expect(result.publications).toEqual(messages)
    expect(result.code).toBe(reasonCode === 0 ? 0 : 1)
    if (reasonCode === 0) {
      expect(result.output).toContain(`All ${messages.length} messages from the ${file} have been successfully sent.`)
      expect(result.output).not.toContain('messages failed to publish.')
    } else {
      expect(result.output).toContain(`${messages.length} of ${messages.length} messages failed to publish.`)
    }
  })
})
