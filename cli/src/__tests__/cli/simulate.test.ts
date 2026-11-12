import { execFile } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
jest.setTimeout(20000)

describe('CLI faker loading', () => {
  let directory: string
  let hook: string
  let loadLog: string

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

  afterEach(() => {
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
})
