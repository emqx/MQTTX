import { exec, ChildProcess } from 'child_process'
import { expect, jest, afterAll } from '@jest/globals'
import util from 'util'

const execAsync = util.promisify(exec)
jest.setTimeout(60000) // Increased timeout to 60 seconds

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

describe('conn', () => {
  let childProcess: ChildProcess | null = null

  afterAll(() => {
    if (childProcess) {
      log('Killing child process in afterAll')
      childProcess.kill()
    }
  })

  it('can get the connect command help info', async () => {
    log('Starting help info test')
    const { stdout } = await execAsync('node ./bin/index.js conn --help')
    expect(stdout.trim()).toContain('Usage: mqttx conn [options]')
    log('Help info test completed')
  })

  it('can connect to public mqtt broker', (done) => {
    log('Starting connection test')
    childProcess = exec('node ./bin/index.js conn -h broker.emqx.io -p 1883 -u mqttx_test_conn')

    let isConnecting = false
    let isConnected = false

    const checkConnection = (data: string) => {
      log(`Process output: ${data.trim()}`)
      if (data.includes('Connecting')) {
        log('Connecting to broker')
        isConnecting = true
      }

      if (data.includes('Connected')) {
        log('Connected to broker')
        isConnected = true
        isConnecting = false
        expect(isConnecting).toBe(false)
        expect(isConnected).toBe(true)
        clearTimeout(timeoutId)
        done()
      }
    }

    childProcess.stdout?.on('data', checkConnection)
    childProcess.stderr?.on('data', (data) => {
      log(`Process error: ${data.trim()}`)
      checkConnection(data)
    })

    childProcess.on('error', (error) => {
      log(`Child process error: ${error.message}`)
    })

    childProcess.on('exit', (code) => {
      log(`Child process exited with code: ${code}`)
    })

    // Set a timeout in case the connection takes too long
    const timeoutId = setTimeout(() => {
      if (!isConnected) {
        log('Connection timed out')
        done(new Error('Connection timed out'))
      }
    }, 55000)

    log('Waiting for connection...')
  })
})
