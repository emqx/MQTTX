import { ChildProcess, spawn } from 'child_process'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

interface CliResult {
  code: number | null
  stdout: string
  output: string
}

export interface CliProcess {
  child: ChildProcess
  closed: Promise<CliResult>
  readonly stdout: string
  readonly output: string
  until: (condition: string | (() => boolean), description?: string) => Promise<void>
}

/** Run CLI processes with an isolated HOME and clean them up after each test. */
export const createCli = () => {
  const children: CliProcess[] = []
  let directory: string | undefined

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-cli-test-'))
  })

  const stop = async (cli: CliProcess) => {
    if (cli.child.exitCode !== null || cli.child.signalCode !== null) return cli.closed
    cli.child.kill('SIGTERM')
    const timeout = setTimeout(() => cli.child.kill('SIGKILL'), 2000)
    try {
      return await cli.closed
    } finally {
      clearTimeout(timeout)
    }
  }

  const cleanup = async () => {
    await Promise.all(children.splice(0).map(stop))
    if (directory) {
      rmSync(directory, { recursive: true, force: true })
      directory = undefined
    }
  }

  afterEach(cleanup)
  afterAll(cleanup)

  const launch = (args: string[], options: { input?: string; env?: NodeJS.ProcessEnv } = {}): CliProcess => {
    const cliArgs = ['./bin/index.js', ...args]
    // A shell pipe gives /dev/stdin a FIFO on Linux instead of a socketpair.
    const child = spawn(
      options.input === undefined ? process.execPath : '/bin/sh',
      options.input === undefined ? cliArgs : ['-c', 'cat | exec "$0" "$@"', process.execPath, ...cliArgs],
      { env: { ...process.env, ...options.env, HOME: directory, USERPROFILE: directory } },
    )
    let stdout = ''
    let output = ''
    child.stdout!.on('data', (data) => {
      stdout += data
      output += data
    })
    child.stderr!.on('data', (data) => {
      output += data
    })
    child.on('error', (error) => {
      output += error.toString()
    })
    const closed = new Promise<CliResult>((resolve) => {
      const timeout = setTimeout(() => child.kill('SIGKILL'), 45000)
      child.once('close', (code) => {
        clearTimeout(timeout)
        resolve({ code, stdout, output })
      })
    })
    child.stdin!.end(options.input)
    const until = async (condition: string | (() => boolean), description = 'CLI output') => {
      const matches = typeof condition === 'string' ? () => output.includes(condition) : condition
      const started = Date.now()
      while (!matches()) {
        if (Date.now() - started > 30000 || child.exitCode !== null || child.signalCode !== null) {
          throw new Error(`Missing ${typeof condition === 'string' ? condition : description}: ${output}`)
        }
        await new Promise((resolve) => setTimeout(resolve, 20))
      }
    }
    const cli = {
      child,
      closed,
      until,
      get stdout() {
        return stdout
      },
      get output() {
        return output
      },
    }
    children.push(cli)
    return cli
  }

  return {
    launch,
    stop,
    get directory() {
      return directory!
    },
  }
}
