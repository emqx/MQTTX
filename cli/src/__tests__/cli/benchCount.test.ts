import { ChildProcess, spawn } from 'child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { createServer, Server, Socket } from 'net'
import { tmpdir } from 'os'
import { join } from 'path'

jest.setTimeout(30000)

describe.each([
  { args: ['bench', 'conn'], key: 'benchConn', invalidCount: '-1' },
  { args: ['bench', 'pub', '-t', 'test/count'], key: 'benchPub', invalidCount: '1.5' },
  { args: ['bench', 'sub', '-t', 'test/count'], key: 'benchSub', invalidCount: 'Infinity' },
  { args: ['simulate', '-sc', 'weather'], key: 'simulate', invalidCount: '0' },
])('$key client count', ({ args, key, invalidCount }) => {
  let directory: string
  let server: Server
  let child: ChildProcess | undefined
  let port: number
  let connections: number
  const sockets = new Set<Socket>()

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-count-test-'))
    connections = 0
    server = createServer((socket) => {
      connections++
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      // Accept the MQTT 3.1.1 CONNECT so valid counts can finish connection setup.
      socket.once('data', () => socket.write(Buffer.from([0x20, 0x02, 0x00, 0x00])))
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
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
    if (server?.listening) await new Promise<void>((resolve) => server.close(() => resolve()))
    rmSync(directory, { recursive: true, force: true })
  })

  const run = (options: string[], stopWhenConnected = false): Promise<{ code: number | null; output: string }> => {
    return new Promise((resolve, reject) => {
      let output = ''
      child = spawn(
        process.execPath,
        ['bin/index.js', ...args, ...options, '-h', '127.0.0.1', '-p', String(port), '-V', '3.1.1', '-i', '0'],
        { env: { ...process.env, HOME: directory } },
      )
      const timer = setTimeout(() => {
        child!.kill()
        reject(new Error(`Client count test timed out: ${output}`))
      }, 20000)
      const collect = (data: Buffer) => {
        output += data.toString()
        if (stopWhenConnected && output.includes('Created 2 connections')) child!.kill()
      }
      child.stdout!.on('data', collect)
      child.stderr!.on('data', collect)
      child.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      child.once('close', (code) => {
        clearTimeout(timer)
        resolve({ code, output })
      })
    })
  }

  it('rejects an invalid CLI count before connecting or saving options', async () => {
    const saved = join(directory, 'saved.json')
    const result = await run(['-c', invalidCount, '--save-options', saved])
    expect(result.code).toBe(1)
    expect(result.output).toContain(
      `Invalid client count: ${invalidCount}. Expected an integer between 1 and 4294967295.`,
    )
    expect(result.output).not.toContain('RangeError')
    expect(connections).toBe(0)
    expect(existsSync(saved)).toBe(false)
  })

  it('validates the loaded count before connecting or saving options', async () => {
    const config = join(directory, 'options.json')
    const saved = join(directory, 'saved.json')
    writeFileSync(config, JSON.stringify({ [key]: { count: -1 } }))
    const result = await run(['--load-options', config, '--save-options', saved])
    expect(result.code).toBe(1)
    expect(result.output).toContain('Invalid client count: -1.')
    expect(result.output).not.toContain('RangeError')
    expect(connections).toBe(0)
    expect(existsSync(saved)).toBe(false)
  })

  it('preserves valid CLI overrides of an invalid saved count', async () => {
    const config = join(directory, 'options.json')
    writeFileSync(
      config,
      JSON.stringify({
        [key]: {
          count: -1,
          clientId: 'count-test',
          clean: true,
          protocol: 'mqtt',
          keepalive: 30,
          maximumReconnectTimes: 0,
          topic: key === 'benchSub' ? ['test/count'] : 'test/count',
          qos: key === 'benchSub' ? [0] : 0,
          message: 'test',
          messageInterval: 1000,
          limit: 0,
        },
      }),
    )
    const result = await run(['--load-options', config, '-c', '2', '-rp', '0'], true)
    expect(result.output).toContain('Created 2 connections')
    expect(result.output).not.toContain('Invalid client count')
    expect(connections).toBe(2)
  })
})
