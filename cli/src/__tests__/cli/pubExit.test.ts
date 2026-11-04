import { ChildProcess, spawn } from 'child_process'
import { createServer, Server, Socket } from 'net'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { generate, parser } from 'mqtt-packet'

jest.setTimeout(20000)

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

  const run = (port: number, mode: string, extra: string[] = [], keepInputOpen = false) => {
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
    child = spawn(process.execPath, [
      ...entry,
      'pub',
      '-h',
      '127.0.0.1',
      '-p',
      String(port),
      '-V',
      '5.0',
      '-rp',
      '0',
      '-t',
      'test/pub-exit',
      ...inputArgs[mode],
      ...extra,
    ])
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
      const port = await listen((socket) => {
        const packets = parser({ protocolVersion: 5 })
        socket.on('data', (data) => packets.parse(data))
        packets.on('packet', (packet) => {
          if (packet.cmd === 'connect') {
            socket.write(generate({ cmd: 'connack', reasonCode: 135, sessionPresent: false }, { protocolVersion: 5 }))
          }
        })
      })
      const result = await run(port, mode)
      expect(result.output).toContain('Not authorized')
      expect(result.code).toBe(1)
      expect(result.signal).toBeNull()
    },
  )

  it.each(['multiline', 'interactive'])('does not wait for open %s stdin after connection failure', async (mode) => {
    const port = await listen()
    await new Promise<void>((resolve) => server!.close(() => resolve()))
    const result = await run(port, mode, [], true)
    expect(result.output).toContain('ECONNREFUSED')
    expect(result.code).toBe(1)
    expect(result.signal).toBeNull()
  })

  it.each(['message', 'multiline'])('exits with failure when a %s publish is rejected', async (mode) => {
    const port = await listen((socket) => {
      const packets = parser({ protocolVersion: 5 })
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => {
        if (packet.cmd === 'connect') {
          socket.write(generate({ cmd: 'connack', reasonCode: 0, sessionPresent: false }, { protocolVersion: 5 }))
        } else if (packet.cmd === 'publish') {
          socket.write(
            generate({ cmd: 'puback', messageId: packet.messageId, reasonCode: 135 }, { protocolVersion: 5 }),
          )
        }
      })
    })
    const result = await run(port, mode, ['-q', '1'])
    expect(result.output).toContain('Publish error')
    expect(result.code).toBe(1)
    expect(result.signal).toBeNull()
  })

  it.each(['message', 'multiline'])(
    'does not wait for pending QoS 1 messages after a %s protocol error',
    async (mode) => {
      const port = await listen((socket) => {
        const packets = parser({ protocolVersion: 5 })
        socket.on('data', (data) => packets.parse(data))
        packets.on('packet', (packet) => {
          if (packet.cmd === 'connect') {
            socket.write(generate({ cmd: 'connack', reasonCode: 0, sessionPresent: false }, { protocolVersion: 5 }))
          } else if (packet.cmd === 'publish') {
            // Invalid packet type, withhold PUBACK to leave an outgoing QoS message pending.
            socket.write(Buffer.from([0, 0]))
          }
        })
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

  it.each(['message', 'multiline', 'interactive'])(
    'fails when the broker silently closes the %s connection before PUBACK',
    async (mode) => {
      let published = false
      const port = await listen((socket) => {
        const packets = parser({ protocolVersion: 5 })
        socket.on('data', (data) => packets.parse(data))
        packets.on('packet', (packet) => {
          if (packet.cmd === 'connect') {
            socket.write(generate({ cmd: 'connack', reasonCode: 0, sessionPresent: false }, { protocolVersion: 5 }))
          } else if (packet.cmd === 'publish') {
            published = true
            // Multiline schedules end() after 1s; an incomplete publish must still fail after that.
            setTimeout(() => socket.end(), mode === 'multiline' ? 1200 : 0)
          }
        })
      })
      const result = await run(port, mode, ['-q', '1'])
      expect(published).toBe(true)
      expect(result.code).toBe(1)
      expect(result.signal).toBeNull()
    },
  )

  it.each(['message', 'multiline'])(
    'still succeeds when the broker closes the %s connection after PUBACK',
    async (mode) => {
      const port = await listen((socket) => {
        const packets = parser({ protocolVersion: 5 })
        socket.on('data', (data) => packets.parse(data))
        packets.on('packet', (packet) => {
          if (packet.cmd === 'connect') {
            socket.write(generate({ cmd: 'connack', reasonCode: 0, sessionPresent: false }, { protocolVersion: 5 }))
          } else if (packet.cmd === 'publish') {
            socket.end(generate({ cmd: 'puback', messageId: packet.messageId }, { protocolVersion: 5 }))
          }
        })
      })
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
      const port = await listen((socket) => {
        const packets = parser({ protocolVersion: 5 })
        socket.on('data', (data) => packets.parse(data))
        packets.on('packet', (packet) => {
          if (packet.cmd === 'connect') {
            socket.write(generate({ cmd: 'connack', reasonCode: 0, sessionPresent: false }, { protocolVersion: 5 }))
          } else if (packet.cmd === 'publish') {
            publications.push(packet.payload.toString().trim())
            socket.write(generate({ cmd: 'puback', messageId: packet.messageId }, { protocolVersion: 5 }))
          }
        })
      })
      const result = await run(port, mode, ['-q', '1'])
      expect(result.code).toBe(0)
      expect(result.signal).toBeNull()
      expect(publications).toEqual(['test payload'])
    },
  )
})
