import { ChildProcess, spawn } from 'child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { createServer, Server, Socket } from 'net'
import { tmpdir } from 'os'
import { join } from 'path'
import { generate, parser } from 'mqtt-packet'

jest.setTimeout(10000)

describe.each([
  { name: 'bench pub', command: ['bench', 'pub'], completions: ['limit', 'split'] },
  { name: 'simulate', command: ['simulate', '-sc', 'weather'], completions: ['limit'] },
])('$name publish completion', ({ command, completions }) => {
  const sockets = new Set<Socket>()
  let server: Server
  let child: ChildProcess | undefined
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-bench-completion-test-'))
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

  it.each(completions)('schedules one exit after %s completion across 50 clients', async (completion) => {
    const publications: string[] = []
    server = createServer((socket) => {
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      const packets = parser({ protocolVersion: 5 })
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => {
        if (packet.cmd === 'connect') {
          socket.write(generate({ cmd: 'connack', reasonCode: 0, sessionPresent: false }, { protocolVersion: 5 }))
        } else if (packet.cmd === 'publish') {
          publications.push(packet.payload.toString())
          socket.write(generate({ cmd: 'puback', messageId: packet.messageId!, reasonCode: 0 }, { protocolVersion: 5 }))
        }
      })
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No test broker port')

    const preload = join(directory, 'count-timeouts.js')
    writeFileSync(
      preload,
      `const originalSetTimeout = global.setTimeout
let timeoutCount = 0
global.setTimeout = (callback, delay, ...args) => {
  if (delay === 1000) timeoutCount++
  return originalSetTimeout(callback, delay, ...args)
}
process.on('exit', () => console.log('One-second timeouts: ' + timeoutCount))
`,
    )
    const file = join(directory, 'messages.txt')
    writeFileSync(file, 'one')
    const expectedCount = completion === 'limit' ? 1 : 50
    const args = completion === 'limit' ? ['-L', '1'] : ['--file-read', file, '--split']
    const result = await new Promise<{ code: number | null; output: string }>((resolve, reject) => {
      let output = ''
      child = spawn(process.execPath, [
        '--require',
        preload,
        'bin/index.js',
        ...command,
        ...args,
        '-h',
        '127.0.0.1',
        '-p',
        String(address.port),
        '-V',
        '5',
        '-c',
        '50',
        '-q',
        '1',
        '-i',
        '0',
        '-im',
        '1',
        '-I',
        'benchmark-completion',
        '-t',
        'test/bench',
        '-v',
      ])
      const timer = setTimeout(() => {
        child!.kill()
        reject(new Error(`Benchmark timed out after ${publications.length} publishes: ${output}`))
      }, 5000)
      child.stdout!.on('data', (data) => (output += data.toString()))
      child.stderr!.on('data', (data) => (output += data.toString()))
      child.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      child.once('close', (code) => {
        clearTimeout(timer)
        resolve({ code, output })
      })
    })

    expect(publications).toHaveLength(expectedCount)
    expect(result.code).toBe(0)
    const summary =
      completion === 'limit'
        ? 'All 1 messages have been sent, reaching the limit of 1.'
        : `All ${expectedCount} messages from the ${file} have been successfully sent.`
    expect(result.output.split(summary)).toHaveLength(2)
    expect(result.output).toContain(`Published total: ${expectedCount}, message rate:`)
    const timeouts = result.output.match(/One-second timeouts: (\d+)/)
    expect(timeouts).not.toBeNull()
    expect(Number(timeouts![1])).toBeGreaterThan(0)
    expect(Number(timeouts![1])).toBeLessThanOrEqual(5)
  })
})
