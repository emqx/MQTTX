import { execFile } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { createServer, Server, Socket } from 'net'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'
import { generate, parser } from 'mqtt-packet'

const execFileAsync = promisify(execFile)
jest.setTimeout(20000)

describe('CLI faker loading', () => {
  let directory: string
  let hook: string
  let loadLog: string
  let server: Server
  const sockets = new Set<Socket>()

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-faker-test-'))
    hook = join(directory, 'track-faker.cjs')
    loadLog = join(directory, 'faker-loads.json')
    writeFileSync(
      hook,
      `
        const Module = require('module');
        const fs = require('fs');
        const load = Module._load;
        const requests = [];
        Module._load = function (request, ...args) {
          if (request === '@faker-js/faker' || request.startsWith('@faker-js/faker/')) requests.push(request);
          return load.call(this, request, ...args);
        };
        process.on('exit', () => fs.writeFileSync(${JSON.stringify(loadLog)}, JSON.stringify(requests)));
      `,
    )
  })

  afterEach(async () => {
    sockets.forEach((socket) => socket.destroy())
    sockets.clear()
    if (server?.listening) await new Promise<void>((resolve) => server.close(() => resolve()))
    rmSync(directory, { recursive: true, force: true })
  })

  const run = (args: string[]) =>
    execFileAsync(process.execPath, ['--require', hook, 'bin/index.js', ...args], {
      timeout: 15000,
      env: { ...process.env, HOME: directory },
    })

  it.each([
    { args: ['--version'], output: 'https://mqttx.app/changelogs/' },
    { args: ['bench', 'pub', '--help'], output: 'Usage: mqttx bench pub [options]' },
  ])('does not load faker for $args', async ({ args, output }) => {
    const { stdout } = await run(args)
    expect(stdout).toContain(output)
    expect(JSON.parse(readFileSync(loadLog, 'utf8'))).toEqual([])
  })

  it.each(['built-in', 'file'])('publishes generated payloads from a %s scenario', async (scenario) => {
    const publications: { topic: string; payload: string }[] = []
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
          publications.push({ topic: packet.topic, payload: packet.payload.toString() })
        }
      })
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No test broker port')

    const file = join(directory, 'scenario.js')
    writeFileSync(
      file,
      `exports.generator = (faker, options) => ({
        topic: 'test/custom/' + options.clientId,
        message: JSON.stringify({ id: faker.string.uuid(), count: options.count }),
      });`,
    )
    await run([
      'simulate',
      ...(scenario === 'built-in' ? ['--scenario', 'weather'] : ['--file', file]),
      '-h',
      '127.0.0.1',
      '-p',
      String(address.port),
      '-V',
      '3.1.1',
      '-I',
      'faker-test',
      '-c',
      '1',
      '-i',
      '0',
      '-im',
      '20',
      '-L',
      '2',
      '-rp',
      '0',
    ])

    expect(JSON.parse(readFileSync(loadLog, 'utf8'))).toContain('@faker-js/faker')
    expect(publications).toHaveLength(2)
    for (const publication of publications) {
      if (scenario === 'built-in') {
        expect(publication.topic).toBe('mqttx/simulate/weather/faker-test')
        expect(JSON.parse(publication.payload)).toEqual(
          expect.objectContaining({
            station_id: expect.any(String),
            current: expect.objectContaining({ temp_c: expect.any(Number) }),
          }),
        )
      } else {
        expect(publication.topic).toBe('test/custom/faker-test')
        expect(JSON.parse(publication.payload)).toEqual({ id: expect.any(String), count: 1 })
      }
    }
  })
})
