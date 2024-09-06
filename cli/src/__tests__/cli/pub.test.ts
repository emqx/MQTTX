import { exec, ChildProcess } from 'child_process'
import { expect, jest, afterAll } from '@jest/globals'
import util from 'util'

const execAsync = util.promisify(exec)
jest.setTimeout(30000)

describe('pub', () => {
  let childProcess: ChildProcess | null = null

  afterAll(() => {
    if (childProcess) {
      childProcess.kill()
    }
  })

  it('can get the pub command help info', async () => {
    const { stdout } = await execAsync('node ./bin/index.js pub --help')
    expect(stdout.trim()).toContain('Usage: mqttx pub [options]')
  })

  it('can publish a message to a topic', (done) => {
    const topic = `test/mqttx/cli/${Date.now()}`
    const message = 'Hello MQTT'
    childProcess = exec(
      `node ./bin/index.js pub -h broker.emqx.io -p 1883 -u mqttx_test_pub -t ${topic} -m "${message}"`,
    )

    let isConnecting = false
    let isPublished = false

    const checkPublication = (data: string) => {
      if (data.includes('Connecting')) {
        isConnecting = true
      }

      if (data.includes('Message published')) {
        isPublished = true
        isConnecting = false
        expect(isConnecting).toBe(false)
        expect(isPublished).toBe(true)
        clearTimeout(timeoutId)
        done()
      }
    }

    childProcess.stdout?.on('data', checkPublication)
    childProcess.stderr?.on('data', checkPublication)

    // Set a timeout in case the publication takes too long
    const timeoutId = setTimeout(() => {
      if (!isPublished) {
        done(new Error('Publication timed out'))
      }
    }, 25000)
  })
})
