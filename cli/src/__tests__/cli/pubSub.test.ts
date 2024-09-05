import { exec, ChildProcess } from 'child_process'
import { expect, jest, afterAll } from '@jest/globals'
import util from 'util'

const execAsync = util.promisify(exec)

jest.setTimeout(60000) // Increased timeout to 60 seconds

describe('pubSub', () => {
  let subProcess: ChildProcess | null = null
  let pubProcess: ChildProcess | null = null
  let timeoutId: NodeJS.Timeout | null = null

  afterAll(() => {
    if (subProcess) subProcess.kill()
    if (pubProcess) pubProcess.kill()
    if (timeoutId) clearTimeout(timeoutId)
  })

  it('can get the pub command help info', async () => {
    const { stdout } = await execAsync('node ./bin/index.js pub --help')
    expect(stdout.trim()).toContain('Usage: mqttx pub [options]')
  })

  it('can get the sub command help info', async () => {
    const { stdout } = await execAsync('node ./bin/index.js sub --help')
    expect(stdout.trim()).toContain('Usage: mqttx sub [options]')
  })

  it('can subscribe to a topic and receive published message', (done) => {
    const topic = 'test/pubsub'
    const message = 'Hello, MQTT!'
    let publisherTimeoutId: NodeJS.Timeout
    let testTimeoutId: NodeJS.Timeout

    // Wrapper function to handle cleanup and calling done
    const cleanupAndDone = (error?: Error) => {
      clearTimeout(testTimeoutId)
      clearTimeout(publisherTimeoutId)
      if (subProcess) subProcess.kill()
      if (pubProcess) pubProcess.kill()
      done(error)
    }

    // Start subscriber
    subProcess = exec(`node ./bin/index.js sub -u mqttx_test_sub -h broker.emqx.io -p 1883 -t ${topic}`)

    let messageReceived = false

    const checkSubOutput = (data: string) => {
      if (data.includes(message)) {
        messageReceived = true
        expect(messageReceived).toBe(true)
        cleanupAndDone()
      }
    }

    subProcess.stdout?.on('data', checkSubOutput)
    subProcess.stderr?.on('data', checkSubOutput)

    // Wait a bit for the subscriber to connect before publishing
    publisherTimeoutId = setTimeout(() => {
      // Start publisher
      pubProcess = exec(
        `node ./bin/index.js pub -u mqttx_test_pub -h broker.emqx.io -p 1883 -t ${topic} -m "${message}"`,
      )

      pubProcess.on('exit', (code) => {
        expect(code).toBe(0)
        // Wait a bit to ensure the message is received by the subscriber
        setTimeout(() => {
          if (!messageReceived) {
            cleanupAndDone(new Error('Message not received'))
          }
        }, 1000)
      })
    }, 2000)

    // Set a timeout in case the test takes too long
    testTimeoutId = setTimeout(() => {
      cleanupAndDone(new Error('Test timed out'))
    }, 55000)
  })
})
