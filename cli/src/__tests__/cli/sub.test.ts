import { exec, ChildProcess } from 'child_process'
import { expect, jest, afterAll, describe, it } from '@jest/globals'
import util from 'util'

const execAsync = util.promisify(exec)
jest.setTimeout(300000)

describe('sub', () => {
  let childProcesses: ChildProcess[] = []

  afterAll(() => {
    childProcesses.forEach((process) => {
      process.kill()
    })
    childProcesses = []
  })

  it('can get the sub command help info', async () => {
    const { stdout } = await execAsync('node ./bin/index.js sub --help')
    expect(stdout.trim()).toContain('Usage: mqttx sub [options]')
  })

  it('can subscribe to a topic and receive messages', (done) => {
    const topic = `testtopic/#`
    const childProcess = exec(`node ./bin/index.js sub -h broker.emqx.io -p 1883 -u mqttx_test_sub -t ${topic}`)
    childProcesses.push(childProcess)

    let isSubscribing = false
    let isSubscribed = false
    let messageReceived = false

    const checkOutput = (data: string) => {
      if (data.includes('Subscribing')) {
        isSubscribing = true
      }

      if (data.includes(`Subscribed to ${topic}`)) {
        isSubscribed = true
        isSubscribing = false
      }

      if (data.includes('topic:') && data.includes('qos:')) {
        messageReceived = true
      }

      if (isSubscribed && messageReceived) {
        expect(isSubscribing).toBe(false)
        expect(isSubscribed).toBe(true)
        expect(messageReceived).toBe(true)
        clearTimeout(timeoutId)
        done()
      }
    }

    childProcess.stdout?.on('data', checkOutput)
    childProcess.stderr?.on('data', checkOutput)

    // Set a timeout in case the subscription or message reception takes too long
    const timeoutId = setTimeout(() => {
      if (!isSubscribed || !messageReceived) {
        done(new Error('Subscription or message reception timed out'))
      }
    }, 25000)
  })
})
