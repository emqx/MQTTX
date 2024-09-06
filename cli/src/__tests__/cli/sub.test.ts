import { exec, ChildProcess } from 'child_process'
import { expect, jest, afterAll } from '@jest/globals'
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

  it('can subscribe to a topic', (done) => {
    const topic = `test/mqttx/cli/${Date.now()}`
    const childProcess = exec(`node ./bin/index.js sub -h broker.emqx.io -p 1883 -u mqttx_test_sub -t ${topic}`)
    childProcesses.push(childProcess)

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

  const topic = `test/mqttx/cli/${Date.now()}`
  const message = 'Hello MQTT'

  it('can receive messages after subscribing', (done) => {
    console.log(`Starting subscription to topic: ${topic}`)
    const subProcess = exec(`node ./bin/index.js sub -h broker.emqx.io -p 1883 -u mqttx_test_sub -t ${topic}`)
    childProcesses.push(subProcess)

    let isSubscribed = false
    let messageReceived = false

    const checkMessageReceived = () => {
      if (!isSubscribed) {
        subProcess.stdout?.emit('data', 'Checking subscription status')
      } else if (!messageReceived) {
        subProcess.stdout?.emit('data', 'Checking for received message')
      }
    }

    const dataHandler = (data: string) => {
      console.log(`Received data: ${data}`)
      if (data.includes(`Subscribed to ${topic}`)) {
        isSubscribed = true
        console.log('Subscription confirmed, publishing message')
        const pubProcess = exec(
          `node ./bin/index.js pub -h broker.emqx.io -p 1883 -u mqttx_test_pub -t ${topic} -m "${message}"`,
        )
        console.log('Published message with message:', message, 'to topic:', topic)
        childProcesses.push(pubProcess)
      }

      if (data.includes(message)) {
        messageReceived = true
        console.log('Message received')
        expect(isSubscribed).toBe(true)
        expect(messageReceived).toBe(true)
        clearInterval(pollInterval)
        clearTimeout(timeoutId)
        done()
      }
    }

    subProcess.stdout?.on('data', dataHandler)
    subProcess.stderr?.on('data', dataHandler)

    // Set up polling interval
    const pollInterval = setInterval(checkMessageReceived, 1000)

    // Set a timeout in case the message is not received
    const timeoutId = setTimeout(() => {
      console.log('Timeout reached, test failed')
      clearInterval(pollInterval)
      done(new Error('Message not received within the timeout period'))
    }, 60000) // 1 minutes

    // Ensure the timer is cleaned up
    timeoutId.unref()
  })
})
