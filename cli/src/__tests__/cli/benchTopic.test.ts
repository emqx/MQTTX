import { ChildProcess, spawn } from 'child_process'
import { createServer, Server, Socket } from 'net'
import { generate, parser } from 'mqtt-packet'

jest.setTimeout(10000)

describe('scenario topic placeholder', () => {
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

  it.each([
    { command: 'bench pub', args: ['bench', 'pub', '-t', 'test/%sc/%i'], topic: 'test/%sc/1' },
    { command: 'simulate', args: ['simulate', '-sc', 'tesla', '-t', 'test/%sc'], topic: 'test/tesla' },
  ])('publishes $command to $topic', async ({ args, topic }) => {
    const publications: string[] = []
    server = createServer((socket) => {
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      const packets = parser({ protocolVersion: 4 })
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => {
        if (packet.cmd === 'connect') {
          socket.write(generate({ cmd: 'connack', returnCode: 0, sessionPresent: false }))
        } else if (packet.cmd === 'publish') {
          publications.push(packet.topic)
        }
      })
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No test broker port')
    const code = await new Promise<number | null>((resolve, reject) => {
      let output = ''
      child = spawn(process.execPath, [
        'bin/index.js',
        ...args,
        '-h',
        '127.0.0.1',
        '-p',
        String(address.port),
        '-V',
        '3.1.1',
        '-c',
        '1',
        '-i',
        '0',
        '-im',
        '20',
        '-L',
        '1',
      ])
      const timer = setTimeout(() => {
        child!.kill()
        reject(new Error(`CLI timed out: ${output}`))
      }, 5000)
      child.stdout!.on('data', (data) => (output += data.toString()))
      child.stderr!.on('data', (data) => (output += data.toString()))
      child.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      child.once('close', (code) => {
        clearTimeout(timer)
        resolve(code)
      })
    })
    expect(code).toBe(0)
    expect(publications).toEqual([topic])
  })
})
