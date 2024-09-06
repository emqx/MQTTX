import { exec, ChildProcess } from 'child_process'
import { expect, jest, afterAll } from '@jest/globals'
import util from 'util'

const execAsync = util.promisify(exec)
jest.setTimeout(60000) // Increased timeout to 60 seconds

describe('conn', () => {
  let childProcess: ChildProcess | null = null

  afterAll(() => {
    if (childProcess) {
      childProcess.kill()
    }
  })

  it('can get the connect command help info', async () => {
    const { stdout } = await execAsync('node ./bin/index.js conn --help')
    expect(stdout.trim()).toContain('Usage: mqttx conn [options]')
  })

  it('can connect to public mqtt broker', (done) => {
    childProcess = exec('node ./bin/index.js conn -h broker.emqx.io -p 1883 -u mqttx_test_conn')

    let isConnecting = false
    let isConnected = false

    const checkConnection = (data: string) => {
      if (data.includes('Connecting')) {
        isConnecting = true
        isConnecting = true
      }

      if (data.includes('Connected')) {
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
      checkConnection(data)
    })

    // Set a timeout in case the connection takes too long
    const timeoutId = setTimeout(() => {
      if (!isConnected) {
        done(new Error('Connection timed out'))
      }
    }, 55000)
  })
})
