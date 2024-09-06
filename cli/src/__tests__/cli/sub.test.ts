import { exec, ChildProcess } from 'child_process'
import { expect, jest, afterAll } from '@jest/globals'
import util from 'util'

const execAsync = util.promisify(exec)
jest.setTimeout(30000) // 30 seconds timeout

describe('sub', () => {
  let childProcess: ChildProcess | null = null

  afterAll(() => {
    if (childProcess) {
      childProcess.kill()
    }
  })

  it('can get the sub command help info', async () => {
    const { stdout } = await execAsync('node ./bin/index.js sub --help')
    expect(stdout.trim()).toContain('Usage: mqttx sub [options]')
  })

  it('can subscribe to a topic', (done) => {
    const topic = `test/mqttx/cli/${Date.now()}`
    childProcess = exec(`node ./bin/index.js sub -h broker.emqx.io -p 1883 -u mqttx_test_sub -t ${topic}`)

    let isSubscribing = false
    let isSubscribed = false

    const checkSubscription = (data: string) => {
      if (data.includes('Subscribing')) {
        isSubscribing = true
        isSubscribing = true
      }

      if (data.includes(`Subscribed to ${topic}`)) {
        isSubscribed = true
        isSubscribing = false
        expect(isSubscribing).toBe(false)
        expect(isSubscribed).toBe(true)
        clearTimeout(timeoutId)
        done()
      }
    }

    childProcess.stdout?.on('data', checkSubscription)
    childProcess.stderr?.on('data', (data) => {
      checkSubscription(data)
    })

    // Set a timeout in case the subscription takes too long
    const timeoutId = setTimeout(() => {
      if (!isSubscribed) {
        done(new Error('Subscription timed out'))
      }
    }, 25000)
  })
})
