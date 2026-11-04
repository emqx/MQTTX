import { ChildProcess, spawn } from 'child_process'
import { createServer, Server, Socket } from 'net'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { generate, parser } from 'mqtt-packet'

jest.setTimeout(10000)

interface Connection {
  socket: Socket
  clientId: string
}

const connack = () => generate({ cmd: 'connack', returnCode: 0, sessionPresent: false }, { protocolVersion: 4 })
const acknowledge = ({ socket }: Connection) => socket.write(connack())

describe('benchmark connection lifecycle', () => {
  const sockets = new Set<Socket>()
  let server: Server
  let child: ChildProcess | undefined
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-bench-test-'))
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

  const run = async (args: string[], onConnect: (client: Connection, index: number) => void = acknowledge) => {
    const connections: Connection[] = []
    const subscriptions: string[] = []
    const publications: { clientId: string; topic: string; payload: string }[] = []
    server = createServer((socket) => {
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      const packets = parser({ protocolVersion: 4 })
      let client: Connection
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => {
        if (packet.cmd === 'connect') {
          client = { socket, clientId: packet.clientId }
          connections.push(client)
          onConnect(client, connections.length)
        } else if (packet.cmd === 'subscribe') {
          subscriptions.push(client.clientId)
          socket.write(generate({ cmd: 'suback', messageId: packet.messageId, granted: [0] }))
        } else if (packet.cmd === 'publish') {
          publications.push({ clientId: client.clientId, topic: packet.topic, payload: packet.payload.toString() })
          if (packet.qos === 1) socket.write(generate({ cmd: 'puback', messageId: packet.messageId }))
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
      ...args,
      '-h',
      '127.0.0.1',
      '-p',
      String(address.port),
      '-V',
      '3.1.1',
      '-i',
      '0',
      '-I',
      'benchmark',
      '-rp',
      '50',
      '--maximum-reconnect-times',
      '5',
    ])
    let output = ''
    child.stdout!.on('data', (data) => (output += data.toString()))
    child.stderr!.on('data', (data) => (output += data.toString()))
    const waitFor = async (condition: () => boolean) => {
      const deadline = Date.now() + 4000
      while (!condition()) {
        if (Date.now() > deadline) throw new Error(`Benchmark timed out: ${output}`)
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }
    return { connections, subscriptions, publications, waitFor, output: () => output }
  }

  it.each(['pub', 'sub'])('starts %s after the first MQTT handshake is interrupted', async (command) => {
    const bench = await run(['bench', command, '-c', '1', '-t', 'test/bench', '-v'], (client, index) => {
      if (index === 1) client.socket.end()
      else acknowledge(client)
    })
    await bench.waitFor(() => (command === 'pub' ? bench.publications.length > 0 : bench.subscriptions.length > 0))
    expect(bench.connections).toHaveLength(2)
    if (command === 'sub') expect(bench.output()).toContain('All connections subscribed')
  })

  it.each(['conn', 'pub', 'sub'])('%s counts only connections that actually closed', async (command) => {
    const args = ['bench', command, '-c', '2']
    if (command !== 'conn') args.push('-t', 'test/bench', '-v')
    const bench = await run(args, (client, index) => {
      if (index === 1) acknowledge(client)
    })
    await bench.waitFor(() => bench.connections.length === 2 && bench.output().includes('[1/2] - Connected'))
    bench.connections[1].socket.end()
    await bench.waitFor(() => bench.output().includes('Client ID: benchmark_2, Connection closed'))
    expect(bench.output()).toContain('[1/2] - Client ID: benchmark_2, Connection closed')
  })

  it.each(['conn', 'pub', 'sub'])('%s becomes ready when a previously connected client recovers', async (command) => {
    const args = ['bench', command, '-c', '2']
    if (command !== 'conn') args.push('-t', 'test/bench', '-v', ...(command === 'pub' ? ['-im', '20'] : []))
    const bench = await run(args, (client, index) => {
      if (index === 1) acknowledge(client)
    })
    await bench.waitFor(() => bench.connections.length === 2 && (command !== 'sub' || bench.subscriptions.length === 1))
    bench.connections[0].socket.end()
    await bench.waitFor(() => bench.connections.length === 3)
    acknowledge(bench.connections[1])
    if (command === 'sub') await bench.waitFor(() => bench.subscriptions.includes('benchmark_2'))
    acknowledge(bench.connections[2])
    await bench.waitFor(() => {
      if (command === 'sub') return bench.output().includes('All connections subscribed')
      if (command === 'pub') return bench.publications.length > 0
      return bench.output().includes('Created 2 connections')
    })
  })

  it('expands %c to each actual publisher ClientId', async () => {
    const bench = await run(['bench', 'pub', '-c', '2', '-t', 'test/%c', '-im', '20', '-L', '2', '-v'])
    await bench.waitFor(() => bench.publications.length === 2)
    expect(
      bench.publications
        .map(({ clientId, topic }) => ({ clientId, topic }))
        .sort((a, b) => a.clientId.localeCompare(b.clientId)),
    ).toEqual([
      { clientId: 'benchmark_1', topic: 'test/benchmark_1' },
      { clientId: 'benchmark_2', topic: 'test/benchmark_2' },
    ])
  })

  it.each([0, 1])('finishes QoS %i split file replay after one publisher disconnects', async (qos) => {
    const file = join(directory, 'messages.txt')
    writeFileSync(file, 'one')
    const bench = await run(
      [
        'bench',
        'pub',
        '-c',
        '2',
        '-t',
        'test/bench',
        '-q',
        String(qos),
        '--file-read',
        file,
        '--split',
        '-im',
        '200',
        '-v',
      ],
      (client, index) => {
        if (index === 1) acknowledge(client)
        if (index === 2) client.socket.end(connack())
      },
    )
    await bench.waitFor(() => bench.publications.length === 1 && bench.connections.length === 3)
    await new Promise((resolve) => setTimeout(resolve, 250))
    acknowledge(bench.connections[2])
    await bench.waitFor(() => bench.output().includes('All 2 messages from'))
    expect([...bench.publications].sort((a, b) => a.clientId.localeCompare(b.clientId))).toEqual([
      { clientId: 'benchmark_1', topic: 'test/bench', payload: 'one' },
      { clientId: 'benchmark_2', topic: 'test/bench', payload: 'one' },
    ])
  })
})
