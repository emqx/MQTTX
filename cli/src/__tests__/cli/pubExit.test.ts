import { ChildProcess, spawn } from 'child_process'
import { createServer, Server, Socket } from 'net'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { generate, IPublishPacket, parser } from 'mqtt-packet'

jest.setTimeout(20000)

const mqtt5 = { protocolVersion: 5 }

describe('publish exit status', () => {
  const sockets = new Set<Socket>()
  let server: Server | undefined
  let child: ChildProcess | undefined
  let directory: string
  let file: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-pub-exit-'))
    file = join(directory, 'message.txt')
    writeFileSync(file, 'test payload')
  })

  afterEach(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const closed = new Promise((resolve) => child!.once('close', resolve))
      child.kill()
      await closed
    }
    sockets.forEach((socket) => socket.destroy())
    sockets.clear()
    if (server?.listening) await new Promise<void>((resolve) => server!.close(() => resolve()))
    rmSync(directory, { recursive: true, force: true })
  })

  const listen = async (onSocket?: (socket: Socket) => void) => {
    server = createServer((socket) => {
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      onSocket?.(socket)
    })
    await new Promise<void>((resolve, reject) => {
      server!.once('error', reject)
      server!.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No test broker port')
    return address.port
  }

  const listenMqtt = (onPublish?: (socket: Socket, packet: IPublishPacket) => void, reasonCode = 0) =>
    listen((socket) => {
      const packets = parser(mqtt5)
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => {
        if (packet.cmd === 'connect') {
          socket.write(generate({ cmd: 'connack', reasonCode, sessionPresent: false }, mqtt5))
        } else if (packet.cmd === 'publish') {
          onPublish?.(socket, packet)
        }
      })
    })

  const puback = (packet: IPublishPacket, reasonCode = 0) =>
    generate({ cmd: 'puback', messageId: packet.messageId, reasonCode }, mqtt5)

  const run = (
    port: number,
    mode: string,
    extra: string[] = [],
    { keepInputOpen = false, reconnectPeriod = 0 } = {},
  ) => {
    const inputArgs: Record<string, string[]> = {
      message: ['-m', 'test payload'],
      file: ['--file-read', file],
      stdin: ['--stdin'],
      multiline: ['--stdin', '--multiline'],
      interactive: ['--line-mode'],
    }
    // Exercise the interactive input path without requiring a terminal in CI.
    const entry =
      mode === 'interactive'
        ? ['-e', "process.stdin.isTTY = true; process.argv.splice(1, 0, 'mqttx'); require('./bin/index.js')"]
        : ['bin/index.js']
    child = spawn(
      process.execPath,
      [
        ...entry,
        'pub',
        '-h',
        '127.0.0.1',
        '-p',
        String(port),
        '-V',
        '5.0',
        '-rp',
        String(reconnectPeriod),
        '-t',
        'test/pub-exit',
        ...inputArgs[mode],
        ...extra,
      ],
      { env: { ...process.env, HOME: directory, USERPROFILE: directory } },
    )
    const running = child
    return new Promise<{ code: number | null; signal: NodeJS.Signals | null; output: string }>((resolve, reject) => {
      let output = ''
      const timeout = setTimeout(() => {
        running.kill()
        reject(new Error(`Publish did not exit: ${output}`))
      }, 15000)
      running.stdout!.on('data', (data) => (output += data.toString()))
      running.stderr!.on('data', (data) => (output += data.toString()))
      running.once('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
      running.once('close', (code, signal) => {
        clearTimeout(timeout)
        resolve({ code, signal, output })
      })
      if (!keepInputOpen) running.stdin!.end('test payload\n')
    })
  }

  it.each(['message', 'file', 'stdin', 'multiline', 'interactive'])(
    'exits with failure when the connection is refused in %s mode',
    async (mode) => {
      const port = await listen()
      await new Promise<void>((resolve) => server!.close(() => resolve()))
      const result = await run(port, mode)
      expect(result.output).toContain('ECONNREFUSED')
      expect(result.code).toBe(1)
      expect(result.signal).toBeNull()
      expect(result.output).not.toContain('Message published')
    },
  )

  it.each(['message', 'multiline', 'interactive'])(
    'exits with failure when the broker rejects %s authentication',
    async (mode) => {
      const port = await listenMqtt(undefined, 135)
      const result = await run(port, mode)
      expect(result.output).toContain('Not authorized')
      expect(result.code).toBe(1)
      expect(result.signal).toBeNull()
    },
  )

  it.each(['multiline', 'interactive'])('does not wait for open %s stdin after connection failure', async (mode) => {
    const port = await listen()
    await new Promise<void>((resolve) => server!.close(() => resolve()))
    const result = await run(port, mode, [], { keepInputOpen: true })
    expect(result.output).toContain('ECONNREFUSED')
    expect(result.code).toBe(1)
    expect(result.signal).toBeNull()
  })

  it.each([
    { mode: 'message', reconnectPeriod: 0 },
    { mode: 'multiline', reconnectPeriod: 0 },
    { mode: 'multiline', reconnectPeriod: 1000 },
  ])(
    'fails without reporting success when a $mode publish is rejected (-rp $reconnectPeriod)',
    async ({ mode, reconnectPeriod }) => {
      const port = await listenMqtt((socket, packet) => socket.write(puback(packet, 135)))
      const result = await run(port, mode, ['-q', '1'], { reconnectPeriod })
      expect(result.output).toContain('Publish error')
      expect(result.output).not.toMatch(/Message published|Successfully published/)
      expect(result.code).toBe(1)
      expect(result.signal).toBeNull()
    },
  )

  it.each(['message', 'multiline'])(
    'does not wait for pending QoS 1 messages after a %s protocol error',
    async (mode) => {
      const port = await listenMqtt((socket) => {
        // Invalid packet type, withhold PUBACK to leave an outgoing QoS message pending.
        socket.write(Buffer.from([0, 0]))
      })
      const result = await run(port, mode, ['-q', '1'])
      expect(result.output).toContain('Not supported')
      expect(result.code).toBe(1)
      expect(result.signal).toBeNull()
    },
  )

  it.each(['message', 'multiline', 'interactive'])(
    'fails when the broker silently closes the %s connection before CONNACK',
    async (mode) => {
      let connected = false
      const port = await listen((socket) =>
        socket.once('data', () => {
          connected = true
          socket.end()
        }),
      )
      const result = await run(port, mode)
      expect(connected).toBe(true)
      expect(result.code).toBe(1)
      expect(result.signal).toBeNull()
      expect(result.output).not.toContain('Message published')
    },
  )

  it.each([
    { mode: 'message', reconnectPeriod: 0, closeDelay: 0 },
    { mode: 'multiline', reconnectPeriod: 0, closeDelay: 1200 },
    { mode: 'multiline', reconnectPeriod: 1000, closeDelay: 0 },
    { mode: 'multiline', reconnectPeriod: 1000, closeDelay: 1200 },
    { mode: 'interactive', reconnectPeriod: 0, closeDelay: 0 },
  ])(
    'fails when the broker silently closes the $mode connection before PUBACK (-rp $reconnectPeriod, delay $closeDelay)',
    async ({ mode, reconnectPeriod, closeDelay }) => {
      let published = false
      const port = await listenMqtt((socket) => {
        published = true
        // Multiline schedules end() after 1s; an incomplete publish must still fail after that.
        if (closeDelay) setTimeout(() => socket.end(), closeDelay)
        else socket.end()
      })
      const result = await run(port, mode, ['-q', '1'], { reconnectPeriod })
      expect(published).toBe(true)
      expect(result.code).toBe(1)
      expect(result.signal).toBeNull()
    },
  )

  it.each(['message', 'multiline'])(
    'still succeeds when the broker closes the %s connection after PUBACK',
    async (mode) => {
      const port = await listenMqtt((socket, packet) => socket.end(puback(packet)))
      const result = await run(port, mode, ['-q', '1'])
      expect(result.code).toBe(0)
      expect(result.signal).toBeNull()
      expect(result.output).toContain(mode === 'message' ? 'Message published' : 'Successfully published 1 messages')
    },
  )

  it.each(['message', 'file', 'stdin', 'multiline'])(
    'still exits successfully after publishing in %s mode',
    async (mode) => {
      const publications: string[] = []
      const port = await listenMqtt((socket, packet) => {
        publications.push(packet.payload.toString().trim())
        socket.write(puback(packet))
      })
      const result = await run(port, mode, ['-q', '1'])
      expect(result.code).toBe(0)
      expect(result.signal).toBeNull()
      expect(publications).toEqual(['test payload'])
    },
  )
})
