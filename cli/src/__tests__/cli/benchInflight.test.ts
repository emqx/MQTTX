import { ChildProcess, spawn } from 'child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { createServer, Server, Socket } from 'net'
import { tmpdir } from 'os'
import { join } from 'path'
import { generate, parser } from 'mqtt-packet'

jest.setTimeout(10000)

interface Connection {
  socket: Socket
  publications: { messageId: number; qos: number }[]
}

describe('benchmark publish in-flight limit', () => {
  const sockets = new Set<Socket>()
  let server: Server
  let child: ChildProcess | undefined
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-bench-inflight-test-'))
  })

  const stop = async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const closed = new Promise((resolve) => child!.once('close', resolve))
      child.kill()
      await closed
    }
    sockets.forEach((socket) => socket.destroy())
    sockets.clear()
    if (server?.listening) await new Promise<void>((resolve) => server.close(() => resolve()))
  }

  afterEach(async () => {
    await stop()
    rmSync(directory, { recursive: true, force: true })
  })

  const run = async (args: string[], nodeArgs: string[] = [], disconnectFirst = false) => {
    const connections: Connection[] = []
    server = createServer((socket) => {
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      const packets = parser({ protocolVersion: 5 })
      const connection: Connection = { socket, publications: [] }
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => {
        if (packet.cmd === 'connect') {
          connections.push(connection)
          socket.write(generate({ cmd: 'connack', reasonCode: 0, sessionPresent: false }, { protocolVersion: 5 }))
        } else if (packet.cmd === 'publish') {
          connection.publications.push({ messageId: packet.messageId!, qos: packet.qos! })
          if (disconnectFirst && connections.length === 1) socket.destroy()
        } else if (packet.cmd === 'pubrel') {
          socket.write(generate({ cmd: 'pubcomp', messageId: packet.messageId, reasonCode: 0 }, { protocolVersion: 5 }))
        }
      })
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No test broker port')
    child = spawn(process.execPath, [
      ...nodeArgs,
      'bin/index.js',
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
      'benchmark-inflight',
      '-t',
      'test/bench',
      '-v',
    ])
    let output = ''
    child.stdout!.on('data', (data) => (output += data.toString()))
    child.stderr!.on('data', (data) => (output += data.toString()))
    const closed = new Promise<number | null>((resolve, reject) => {
      child!.once('error', reject)
      child!.once('close', resolve)
    })
    const waitFor = async (condition: () => boolean) => {
      const deadline = Date.now() + 4000
      while (!condition()) {
        if (Date.now() > deadline || child!.exitCode !== null || child!.signalCode !== null) {
          throw new Error(`Benchmark did not reach expected state: ${output}`)
        }
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }
    return {
      connections,
      waitFor,
      closed,
      output: () => output,
      acknowledge: () => {
        connections.forEach(({ socket, publications }) => {
          publications.forEach(({ messageId, qos }) => {
            socket.write(
              generate({ cmd: qos === 1 ? 'puback' : 'pubrec', messageId, reasonCode: 0 }, { protocolVersion: 5 }),
            )
          })
        })
      },
    }
  }

  it.each([
    { name: 'QoS 1', command: ['bench', 'pub'], qos: 1, cap: 5, count: 1, options: ['--max-inflight', '5'] },
    { name: 'default QoS 1', command: ['bench', 'pub'], qos: 1, cap: 1000, count: 1, options: [] },
    { name: 'QoS 2', command: ['bench', 'pub'], qos: 2, cap: 5, count: 1, options: ['--max-inflight', '5'] },
    { name: 'multiple clients', command: ['bench', 'pub'], qos: 1, cap: 5, count: 2, options: ['--max-inflight', '5'] },
    {
      name: 'simulate',
      command: ['simulate', '-sc', 'weather'],
      qos: 1,
      cap: 5,
      count: 1,
      options: ['--max-inflight', '5'],
    },
  ])('caps $name at $cap per connection until acknowledged', async ({ command, qos, cap, count, options }) => {
    const bench = await run([...command, '-c', String(count), '-q', String(qos), ...options])
    await bench.waitFor(
      () => bench.connections.length === count && bench.connections.every((c) => c.publications.length >= cap),
    )
    await new Promise((resolve) => setTimeout(resolve, 1000))
    for (const connection of bench.connections) {
      expect(connection.publications).toHaveLength(cap)
      expect(new Set(connection.publications.map(({ messageId }) => messageId)).size).toBe(cap)
    }
    bench.acknowledge()
    await bench.waitFor(() => bench.connections.every((c) => c.publications.length >= cap * 2))
    await new Promise((resolve) => setTimeout(resolve, 100))
    for (const connection of bench.connections) expect(connection.publications).toHaveLength(cap * 2)
    expect(
      bench
        .output()
        .split(
          `Waiting for acknowledgements: in-flight limit ${cap} per connection reached. Use --max-inflight to raise it (max 65535).`,
        ),
    ).toHaveLength(2)
  })

  it('keeps the one-time hint visible while the interactive rate line updates', async () => {
    const preload = join(directory, 'interactive.js')
    writeFileSync(
      preload,
      `process.stdout.isTTY = true
process.argv = process.argv.filter((arg) => arg !== '-v')
`,
    )
    const bench = await run(['bench', 'pub', '-c', '2', '-q', '1', '--max-inflight', '5'], ['--require', preload])
    await bench.waitFor(() => bench.connections.length === 2)
    await bench.waitFor(() => (bench.output().match(/Published total:/g) ?? []).length >= 2)
    const parts = bench
      .output()
      .split(
        'Waiting for acknowledgements: in-flight limit 5 per connection reached. Use --max-inflight to raise it (max 65535).',
      )
    expect(parts).toHaveLength(2)
    expect(parts[1].split('Published total:')[0]).not.toContain('\u001b[1A')
    expect(parts[1]).toContain('\u001b[1A')
    expect(bench.connections.map(({ publications }) => publications.length)).toEqual([5, 5])
  })

  describe.each([
    { command: ['bench', 'pub'], key: 'benchPub' },
    { command: ['simulate', '-sc', 'weather'], key: 'simulate' },
  ])('$key options', ({ command, key }) => {
    it.each(['0', '65536', 'not-a-number'])('rejects --max-inflight %s before connecting', async (value) => {
      const saved = join(directory, 'saved.json')
      const bench = await run([...command, '-c', '1', '--max-inflight', value, '--save-options', saved])
      await bench.waitFor(() => child!.exitCode !== null)
      expect(await bench.closed).toBe(1)
      expect(bench.connections).toHaveLength(0)
      expect(existsSync(saved)).toBe(false)
      expect(bench.output()).toContain(
        value === 'not-a-number'
          ? 'not-a-number is not a number.'
          : `Invalid max inflight: ${value}. Expected an integer between 1 and 65535.`,
      )
    })

    it('round-trips the cap through saved options and allows a CLI override', async () => {
      const file = join(directory, 'options.json')
      let bench = await run([...command, '-c', '1', '-q', '1', '--max-inflight', '5', '--save-options', file])
      await bench.waitFor(() => bench.connections[0]?.publications.length === 5)
      expect(JSON.parse(readFileSync(file, 'utf8'))[key].maxInflight).toBe(5)
      await stop()
      bench = await run([...command, '--load-options', file])
      await bench.waitFor(() => bench.connections[0]?.publications.length >= 5)
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(bench.connections[0].publications).toHaveLength(5)
      await stop()
      bench = await run([...command, '--load-options', file, '--max-inflight', '2'])
      await bench.waitFor(() => bench.connections[0]?.publications.length >= 2)
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(bench.connections[0].publications).toHaveLength(2)
    })
  })

  it.each([false, true])('releases a QoS 0 drain callback on close with late drain=%s', async (lateDrain) => {
    const preload = join(directory, 'hold-drain.js')
    writeFileSync(
      preload,
      `const mqttPacket = require(${JSON.stringify(require.resolve('mqtt-packet'))})
const writeToStream = mqttPacket.writeToStream
let held = false
mqttPacket.writeToStream = (packet, stream, options) => {
  const result = writeToStream(packet, stream, options)
  if (packet.cmd === 'publish' && packet.qos === 0 && !held) {
    held = true
    console.log('Holding QoS 0 callback until drain')
    if (${lateDrain}) stream.once('close', () => setTimeout(() => {
      stream.emit('drain')
      console.log('Emitted late drain')
    }, 100))
    return false
  }
  return result
}
`,
    )
    const bench = await run(
      ['bench', 'pub', '-c', '1', '-q', '0', '--max-inflight', '1', '-L', '2', '-rp', '50'],
      ['--require', preload],
      true,
    )
    await bench.waitFor(() => bench.connections.length === 2 && bench.connections[1].publications.length === 1)
    await bench.waitFor(() => child!.exitCode !== null)
    expect(await bench.closed).toBe(1)
    expect(bench.connections.map(({ publications }) => publications.length)).toEqual([1, 1])
    expect(bench.output()).toContain('Holding QoS 0 callback until drain')
    expect(bench.output()).toContain('1 of 2 messages failed to publish.')
    if (lateDrain) expect(bench.output()).toContain('Emitted late drain')
  })
})
