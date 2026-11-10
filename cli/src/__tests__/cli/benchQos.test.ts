import { ChildProcess, spawn } from 'child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { createServer, Server, Socket } from 'net'
import { tmpdir } from 'os'
import { join } from 'path'
import { generate, Packet, parser } from 'mqtt-packet'

jest.setTimeout(20000)

const qosOptions = [
  { command: 'pub', option: '--qos', key: 'qos' },
  { command: 'sub', option: '--qos', key: 'qos' },
  ...['conn', 'pub', 'sub'].map((command) => ({ command, option: '--will-qos', key: 'willQos' })),
]

describe('benchmark QoS validation', () => {
  const sockets = new Set<Socket>()
  let server: Server
  let child: ChildProcess | undefined
  let directory: string
  let connections: number
  let port: number
  let packets: Packet[]
  let onPacket: ((packet: Packet) => void) | undefined

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-bench-qos-'))
    connections = 0
    packets = []
    onPacket = undefined
    server = createServer((socket) => {
      connections++
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      const decoder = parser({ protocolVersion: 4 })
      socket.on('data', (data) => decoder.parse(data))
      decoder.on('packet', (packet) => {
        packets.push(packet)
        if (packet.cmd === 'connect') {
          socket.write(generate({ cmd: 'connack', returnCode: 0, sessionPresent: false }))
        }
        onPacket?.(packet)
      })
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
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
    sockets.forEach((socket) => socket.destroy())
    sockets.clear()
    await new Promise<void>((resolve) => server.close(() => resolve()))
    rmSync(directory, { recursive: true, force: true })
  })

  const run = (command: string, args: string[], done?: (packet: Packet) => boolean) => {
    onPacket = (packet) => {
      if (done?.(packet)) child!.kill()
    }
    child = spawn(process.execPath, [
      'bin/index.js',
      'bench',
      command,
      '-h',
      '127.0.0.1',
      '-p',
      String(port),
      '-V',
      '3.1.1',
      '-c',
      '1',
      '-i',
      '0',
      ...(command === 'conn' ? [] : ['-t', 'test/qos']),
      ...(command === 'pub' ? ['-im', '0'] : []),
      ...args,
    ])
    let output = ''
    child.stdout!.on('data', (data) => (output += data.toString()))
    child.stderr!.on('data', (data) => (output += data.toString()))
    return new Promise<{ code: number | null; signal: NodeJS.Signals | null; output: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        child!.kill()
        reject(new Error(`CLI did not exit: ${output}`))
      }, 15000)
      child!.once('error', reject)
      child!.once('close', (code, signal) => {
        clearTimeout(timeout)
        resolve({ code, signal, output })
      })
    })
  }

  describe.each(qosOptions)('bench $command $option', ({ command, option, key }) => {
    it.each(['3', '-1', '0.5', ''])('rejects %p before opening a connection', async (value) => {
      const result = await run(command, [`${option}=${value}`])
      expect(result).toMatchObject({ code: 1, signal: null })
      expect(result.output).toContain('is not a valid QoS.')
      expect(result.output).not.toContain('TypeError')
      expect(connections).toBe(0)
    })

    it.each([3, 0.5, { toString: null }])(
      'rejects invalid loaded QoS %p before saving or connecting',
      async (value) => {
        const config = join(directory, 'options.json')
        const saved = join(directory, 'saved.json')
        const commandType = `bench${command[0].toUpperCase()}${command.slice(1)}`
        const qos = command === 'sub' && key === 'qos' ? [0, value] : value
        writeFileSync(config, JSON.stringify({ [commandType]: { [key]: qos } }))
        const result = await run(command, ['--load-options', config, '--save-options', saved])
        expect(result).toMatchObject({ code: 1, signal: null })
        expect(result.output).toContain('is not a valid QoS.')
        expect(result.output).not.toContain('TypeError')
        expect(connections).toBe(0)
        expect(existsSync(saved)).toBe(false)
      },
    )

    it.each([0, 1, 2])('preserves valid QoS %s on the wire', async (qos) => {
      const args = [option, String(qos)]
      if (key === 'willQos') args.push('--will-topic', 'test/will', '--will-message', 'offline')
      const target = key === 'willQos' ? 'connect' : command === 'pub' ? 'publish' : 'subscribe'
      await run(command, args, (packet) => packet.cmd === target)
      const packet = packets.find((entry) => entry.cmd === target)
      expect(connections).toBe(1)
      if (key === 'willQos') {
        expect(packet).toMatchObject({ will: { qos } })
      } else if (command === 'pub') {
        expect(packet).toMatchObject({ qos })
      } else {
        expect(packet).toMatchObject({ subscriptions: [{ qos }] })
      }
    })
  })
})
