import { ChildProcess, spawn } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { createServer, Server, Socket } from 'net'
import { tmpdir } from 'os'
import { join } from 'path'
import { createServer as createTlsServer } from 'tls'
import { generate, parser } from 'mqtt-packet'

jest.setTimeout(30000)

describe('benchmark reconnection after connection errors', () => {
  const sockets = new Set<Socket>()
  let server: Server
  let port: number
  let child: ChildProcess | undefined
  let directory: string
  let output: string
  let publications: string[]
  let acknowledgePublications: boolean
  let rejectConnections: boolean
  let interruptHandshakes: boolean

  const listen = () =>
    new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, '127.0.0.1', () => {
        server.removeListener('error', reject)
        resolve()
      })
    })

  const stopBroker = async () => {
    sockets.forEach((socket) => socket.destroy())
    sockets.clear()
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()))
  }

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-bench-reconnect-'))
    child = undefined
    output = ''
    publications = []
    acknowledgePublications = true
    rejectConnections = false
    interruptHandshakes = false
    server = createServer((socket) => {
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      const packets = parser({ protocolVersion: 4 })
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => {
        if (packet.cmd === 'connect') {
          if (interruptHandshakes) {
            socket.end()
            return
          }
          socket.write(generate({ cmd: 'connack', returnCode: rejectConnections ? 5 : 0, sessionPresent: false }))
        } else if (packet.cmd === 'subscribe') {
          socket.write(generate({ cmd: 'suback', messageId: packet.messageId, granted: [0] }))
        } else if (packet.cmd === 'publish') {
          publications.push(packet.payload.toString())
          if (packet.qos === 1 && acknowledgePublications) {
            socket.write(generate({ cmd: 'puback', messageId: packet.messageId }))
          }
        }
      })
    })
    port = 0
    await listen()
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No test broker port')
    port = address.port
  })

  afterEach(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const closed = new Promise((resolve) => child!.once('close', resolve))
      child.kill()
      await closed
    }
    await stopBroker()
    rmSync(directory, { recursive: true, force: true })
  })

  const start = async (command: string, extra: string[] = [], reconnectPeriod = 100, maximumReconnectTimes = 20) => {
    const args = ['bench', command, '-c', '1', '-i', '0']
    if (command !== 'conn') args.push('-t', 'test/reconnect', '-v')
    child = spawn(process.execPath, [
      'bin/index.js',
      ...args,
      '-h',
      '127.0.0.1',
      '-p',
      String(port),
      '-V',
      '3.1.1',
      '-rp',
      String(reconnectPeriod),
      '--maximum-reconnect-times',
      String(maximumReconnectTimes),
      ...extra,
    ])
    child.stdout!.on('data', (data) => (output += data.toString()))
    child.stderr!.on('data', (data) => (output += data.toString()))
    await waitFor(() => output.includes('Starting'), 15000)
  }

  const waitFor = async (condition: () => boolean, timeout = 6000) => {
    const deadline = Date.now() + timeout
    while (!condition()) {
      if (Date.now() > deadline) throw new Error(`Benchmark timed out: ${output}`)
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  it.each(['conn', 'pub', 'sub'])('%s retries an initially refused connection and becomes ready', async (command) => {
    await stopBroker()
    await start(command, command === 'pub' ? ['-im', '20', '-L', '1'] : [])
    await waitFor(() => output.includes('ECONNREFUSED'))
    expect(child!.exitCode).toBeNull()
    await listen()
    await waitFor(() => output.includes('Created 1 connections'))
    expect(output).toContain('Reconnecting')
    if (command === 'pub') {
      await waitFor(() => child!.exitCode !== null)
      expect(child!.exitCode).toBe(0)
      expect(publications).toHaveLength(1)
    } else if (command === 'sub') {
      await waitFor(() => output.includes('All connections subscribed'))
    }
  })

  it.each([0, 1])('resumes QoS %i split replay after a refused reconnect attempt', async (qos) => {
    const file = join(directory, 'messages.txt')
    const messages = ['one', 'two', 'three', 'four']
    writeFileSync(file, messages.join('\n'))
    await start('pub', ['-q', String(qos), '--file-read', file, '--split', '-im', '250'])
    await waitFor(() => publications.length === 1)
    await stopBroker()
    await waitFor(() => output.includes('ECONNREFUSED'))
    await listen()
    await waitFor(() => child!.exitCode !== null)
    expect(child!.exitCode).toBe(0)
    expect(output).toContain('Reconnected')
    expect(output).toContain('All 4 messages from')
    expect(publications).toEqual(messages)
  })

  it.each(['conn', 'pub', 'sub'])('%s fails without retrying when reconnection is disabled', async (command) => {
    await stopBroker()
    await start(command, [], 0)
    await waitFor(() => child!.exitCode !== null)
    expect(child!.exitCode).toBe(1)
    expect(output).toContain('ECONNREFUSED')
    expect(output).not.toContain('Reconnecting')
  })

  it.each(['conn', 'pub', 'sub'])('%s stops after exhausting its retry budget', async (command) => {
    await stopBroker()
    await start(command, [], 50, 2)
    await waitFor(() => child!.exitCode !== null)
    expect(child!.exitCode).toBe(1)
    expect(output.match(/Reconnecting/g)).toHaveLength(2)
    expect(output).toContain('Exceed the maximum reconnect times limit')
  })

  it.each(['conn', 'pub', 'sub'])('%s still terminates on an MQTT authentication rejection', async (command) => {
    rejectConnections = true
    await start(command)
    await waitFor(() => child!.exitCode !== null)
    expect(child!.exitCode).toBe(1)
    expect(output).toContain('Connection refused: Not authorized')
    expect(output).not.toContain('Reconnecting')
  })

  it.each(['conn', 'pub', 'sub'])('%s fails after repeated interrupted MQTT handshakes', async (command) => {
    interruptHandshakes = true
    await start(command, [], 50, 2)
    await waitFor(() => child!.exitCode !== null)
    expect(child!.exitCode).toBe(1)
    expect(output.match(/Reconnecting/g)).toHaveLength(2)
    expect(output).toContain('Exceed the maximum reconnect times limit')
  })

  it.each(['conn', 'pub', 'sub'])(
    '%s fails on an interrupted handshake when reconnection is disabled',
    async (command) => {
      interruptHandshakes = true
      await start(command, [], 0)
      await waitFor(() => child!.exitCode !== null)
      expect(child!.exitCode).toBe(1)
      expect(output).not.toContain('Reconnecting')
    },
  )

  it('fails an interrupted split replay when reconnection is disabled', async () => {
    const file = join(directory, 'messages.txt')
    writeFileSync(file, 'one\ntwo')
    await start('pub', ['--file-read', file, '--split', '-im', '250'], 0)
    await waitFor(() => publications.length === 1)
    await stopBroker()
    await waitFor(() => child!.exitCode !== null)
    expect(child!.exitCode).toBe(1)
    expect(output).not.toContain('Reconnecting')
  })

  it.each(['conn', 'pub', 'sub'])('%s fails without retrying an untrusted TLS certificate', async (command) => {
    await stopBroker()
    const fixtures = join(__dirname, '../../../../tests/unit/fixtures')
    server = createTlsServer({
      key: readFileSync(join(fixtures, 'test-key.pem')),
      cert: readFileSync(join(fixtures, 'test-cert.pem')),
    })
    await listen()
    await start(command, ['-l', 'mqtts'])
    await waitFor(() => child!.exitCode !== null)
    expect(child!.exitCode).toBe(1)
    expect(output).toMatch(/self.signed certificate/i)
    expect(output).not.toContain('Reconnecting')
  })

  it('terminates after retry exhaustion even with an unacknowledged QoS 1 publish', async () => {
    acknowledgePublications = false
    await start('pub', ['-q', '1', '-im', '20', '-L', '1'], 50, 2)
    await waitFor(() => publications.length === 1)
    await stopBroker()
    await waitFor(() => child!.exitCode !== null)
    expect(child!.exitCode).toBe(1)
    expect(output.match(/Reconnecting/g)).toHaveLength(2)
  })
})
