import { ChildProcess, spawn } from 'child_process'
import { createServer, Server, Socket } from 'net'
import { generate, parser } from 'mqtt-packet'

jest.setTimeout(15000)

describe('benchmark subscription grants', () => {
  const sockets = new Set<Socket>()
  let server: Server
  let child: ChildProcess | undefined

  afterEach(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const closed = new Promise((resolve) => child!.once('close', resolve))
      child.kill()
      await closed
    }
    sockets.forEach((socket) => socket.destroy())
    sockets.clear()
    if (server?.listening) await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  const run = async (grants: number[]) => {
    const accepted: { socket: Socket; topic: string }[] = []
    server = createServer((socket) => {
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      const packets = parser({ protocolVersion: 4 })
      let clientId: string
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => {
        if (packet.cmd === 'connect') {
          clientId = packet.clientId
          socket.write(generate({ cmd: 'connack', returnCode: 0, sessionPresent: false }))
        } else if (packet.cmd === 'subscribe') {
          const grant = grants[Number(clientId.split('_').pop()) - 1]
          socket.write(generate({ cmd: 'suback', messageId: packet.messageId, granted: [grant] }))
          if (grant <= 2) accepted.push({ socket, topic: packet.subscriptions[0].topic })
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
      'bin/index.js',
      'bench',
      'sub',
      '-h',
      '127.0.0.1',
      '-p',
      String(address.port),
      '-V',
      '3.1.1',
      '-c',
      '2',
      '-i',
      '0',
      '-I',
      'benchmark',
      '-t',
      'test/bench',
      '-v',
    ])
    let output = ''
    child.stdout!.on('data', (data) => (output += data.toString()))
    child.stderr!.on('data', (data) => (output += data.toString()))
    const closed = new Promise((resolve) => child!.once('close', resolve))
    const waitFor = async (condition: () => boolean) => {
      const deadline = Date.now() + 6000
      while (!condition()) {
        if (Date.now() > deadline) throw new Error(`Benchmark timed out: ${output}`)
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }
    return { accepted, closed, waitFor, output: () => output }
  }

  it('reports partial grants and keeps receiving on the accepted subscription', async () => {
    const bench = await run([0, 0x80])
    await bench.waitFor(() => bench.output().includes('Subscription negated'))
    expect(bench.output()).not.toContain('All connections subscribed')
    expect(bench.output().match(/Subscribed 1 of 2 topics/g)).toHaveLength(1)
    expect(bench.output()).toContain('Client ID: benchmark_2, Subscription negated to "test/bench" with code 128')
    expect(bench.accepted).toHaveLength(1)
    const { socket, topic } = bench.accepted[0]
    socket.write(
      generate({ cmd: 'publish', topic, payload: Buffer.from('accepted'), qos: 0, dup: false, retain: false }),
    )
    await bench.waitFor(() => bench.output().includes('Received total: 1'))
    expect(child!.exitCode).toBeNull()
    expect(child!.signalCode).toBeNull()
  })

  it('keeps the all-success message when every grant succeeds', async () => {
    const bench = await run([0, 0])
    await bench.waitFor(() => bench.output().includes('All connections subscribed'))
    expect(bench.output().match(/All connections subscribed/g)).toHaveLength(1)
    expect(bench.output()).not.toMatch(/Subscribed \d+ of \d+ topics/)
    expect(bench.output()).not.toContain('Subscription negated')
    expect(bench.accepted).toHaveLength(2)
    expect(child!.exitCode).toBeNull()
  })

  it('exits with code 1 and lists every rejection when all grants fail', async () => {
    const bench = await run([0x80, 0x80])
    await bench.waitFor(() => child!.exitCode !== null)
    await bench.closed
    expect(child!.exitCode).toBe(1)
    expect(bench.output()).not.toContain('All connections subscribed')
    expect(bench.output()).toContain('Client ID: benchmark_1, Subscription negated to "test/bench" with code 128')
    expect(bench.output()).toContain('Client ID: benchmark_2, Subscription negated to "test/bench" with code 128')
    expect(bench.accepted).toHaveLength(0)
  })
})
