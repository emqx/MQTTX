import { ChildProcess, spawn } from 'child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { createServer, Server, Socket } from 'net'
import { tmpdir } from 'os'
import { join } from 'path'
import { generate, parser } from 'mqtt-packet'

jest.setTimeout(15000)

describe('benchmark interrupt statistics', () => {
  const sockets = new Set<Socket>()
  let server: Server
  let child: ChildProcess | undefined
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-bench-interrupt-test-'))
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

  const run = async (args: string[], rejectPublishes = false) => {
    const connections: Socket[] = []
    let publications = 0
    let delivered = 0
    let acknowledged = 0
    server = createServer((socket) => {
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      const packets = parser({ protocolVersion: 5 })
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => {
        if (packet.cmd === 'connect') {
          connections.push(socket)
        } else if (packet.cmd === 'subscribe') {
          socket.write(generate({ cmd: 'suback', messageId: packet.messageId, granted: [1] }, { protocolVersion: 5 }))
        } else if (packet.cmd === 'publish') {
          publications += 1
          if (packet.qos === 1) {
            socket.write(
              generate(
                { cmd: 'puback', messageId: packet.messageId!, reasonCode: rejectPublishes ? 0x80 : 0 },
                { protocolVersion: 5 },
              ),
            )
          }
        } else if (packet.cmd === 'puback') {
          acknowledged += 1
        }
      })
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No test broker port')
    const preload = join(directory, 'interactive.js')
    writeFileSync(preload, 'process.stdout.isTTY = true\n')
    child = spawn(process.execPath, [
      '--require',
      preload,
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
      '-I',
      'benchmark-interrupt',
      '-c',
      '2',
    ])
    let output = ''
    let readyAt = 0
    const collect = (data: Buffer) => {
      output += data.toString()
      const ready = args[1] === 'sub' ? 'All connections subscribed' : 'Created 2 connections'
      if (!readyAt && output.includes(ready)) readyAt = Date.now()
    }
    child.stdout!.on('data', collect)
    child.stderr!.on('data', collect)
    const closed = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
      child!.once('error', reject)
      child!.once('close', (code, signal) => resolve({ code, signal }))
    })
    const waitFor = async (condition: () => boolean) => {
      const deadline = Date.now() + 7000
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
      output: () => output,
      ready: () => readyAt > 0,
      publications: () => publications,
      delivered: () => delivered,
      acknowledged: () => acknowledged,
      connect: (socket: Socket) =>
        socket.write(generate({ cmd: 'connack', reasonCode: 0, sessionPresent: false }, { protocolVersion: 5 })),
      deliver: (count: number) => {
        for (const socket of connections) {
          for (let i = 0; i < count; i++) {
            delivered += 1
            socket.write(
              generate(
                {
                  cmd: 'publish',
                  topic: 'test/bench',
                  payload: 'message',
                  qos: 1,
                  messageId: delivered,
                  dup: false,
                  retain: false,
                },
                { protocolVersion: 5 },
              ),
            )
          }
        }
      },
      interrupt: async () => {
        const elapsed = readyAt ? (Date.now() - readyAt) / 1000 : 0
        child!.kill('SIGINT')
        await waitFor(() => child!.exitCode !== null || child!.signalCode !== null)
        expect(await closed).toEqual({ code: 130, signal: null })
        return elapsed
      },
    }
  }

  const expectElapsed = (output: string, expected: number) => {
    const summaries = output.match(/elapsed: (\d+\.\d+)s/g) ?? []
    expect(summaries).toHaveLength(1)
    const elapsed = Number(summaries[0].match(/[\d.]+/)![0])
    expect(Math.abs(elapsed - expected)).toBeLessThan(0.5)
    expect(output.trim().endsWith(summaries[0])).toBe(true)
    expect(output.slice(output.lastIndexOf('/s'))).not.toContain('\u001b[1A')
  }

  it.each([
    { command: ['bench', 'pub'], qos: 0, verbose: false, reject: false },
    { command: ['bench', 'pub'], qos: 1, verbose: true, reject: false },
    { command: ['simulate', '-sc', 'weather'], qos: 0, verbose: true, reject: false },
    { command: ['simulate', '-sc', 'weather'], qos: 1, verbose: false, reject: false },
    { command: ['bench', 'pub'], qos: 1, verbose: false, reject: true },
  ])('prints final $command QoS $qos totals with verbose=$verbose and rejected=$reject', async (test) => {
    const limit = 30
    const bench = await run(
      [
        ...test.command,
        '-t',
        'test/bench',
        '-q',
        String(test.qos),
        '-im',
        '100',
        '-L',
        String(limit),
        ...(test.verbose ? ['-v'] : []),
      ],
      test.reject,
    )
    await bench.waitFor(() => bench.connections.length === 2)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    bench.connections.forEach(bench.connect)
    await bench.waitFor(() => bench.ready() && bench.output().includes('message rate:'))
    await bench.waitFor(() => bench.publications() === limit)
    if (test.reject) {
      await bench.waitFor(() => (bench.output().match(/Publish error/g) ?? []).length === limit)
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
    const elapsed = await bench.interrupt()
    const summary = test.reject
      ? `Published total: 0, failed: ${bench.publications()}, elapsed:`
      : `Published total: ${bench.publications()}, elapsed:`
    expect(bench.output().split(summary)).toHaveLength(2)
    if (!test.reject) expect(bench.output()).not.toContain('failed:')
    expectElapsed(bench.output(), elapsed)
  })

  it.each([false, true])(
    'includes messages delivered after the last sub rate line with verbose=%s',
    async (verbose) => {
      const bench = await run(['bench', 'sub', '-t', 'test/bench', '-q', '1', ...(verbose ? ['-v'] : [])])
      await bench.waitFor(() => bench.connections.length === 2)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      bench.connections.forEach(bench.connect)
      await bench.waitFor(bench.ready)
      bench.deliver(3)
      await bench.waitFor(() => bench.output().includes('Received total: 6, rate:'))
      bench.deliver(2)
      await bench.waitFor(() => bench.acknowledged() === bench.delivered())
      const elapsed = await bench.interrupt()
      expect(bench.output()).toContain(`Received total: ${bench.delivered()}, elapsed:`)
      expectElapsed(bench.output(), elapsed)
    },
  )

  it.each([1, 2])('prints the connected count out of the requested count with %i clients connected', async (count) => {
    const bench = await run(['bench', 'conn'])
    await bench.waitFor(() => bench.connections.length === 2)
    bench.connections.slice(0, count).forEach(bench.connect)
    await bench.waitFor(() => bench.output().includes(`[${count}/2] - Connected`))
    if (count === 2) await bench.waitFor(bench.ready)
    await bench.interrupt()
    expect(bench.output().match(/Connected total: \d+\/2/g)).toEqual([`Connected total: ${count}/2`])
    expect(bench.output().trim().endsWith(`Connected total: ${count}/2`)).toBe(true)
  })
})
