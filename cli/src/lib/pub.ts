import * as mqtt from 'mqtt'
import pump from 'pump'
import concat from 'concat-stream'
import { Writable } from 'readable-stream'
import split2 from 'split2'
import { IClientOptions, IClientPublishOptions } from 'mqtt'
import { Signale, signale, basicLog, benchLog, simulateLog } from '../utils/signale'
import { parseConnectOptions, parsePublishOptions, checkTopicExists, checkScenarioExists } from '../utils/parse'
import delay from '../utils/delay'
import { saveConfig, loadConfig } from '../utils/config'
import { loadSimulator } from '../utils/simulate'
import { serializeProtobufToBuffer } from '../utils/protobuf'
const send = (
  config: boolean | string | undefined,
  connOpts: IClientOptions,
  pubOpts: {
    topic: string
    message: string | Buffer
    protobufPath: string | undefined
    protobufMessageName: string | undefined
    protobufFormat: FormatType | undefined
    opts: IClientPublishOptions
  },
) => {
  const client = mqtt.connect(connOpts)
  basicLog.connecting(config, connOpts.hostname!, connOpts.port, pubOpts.topic, pubOpts.message.toString())
  client.on('connect', () => {
    basicLog.connected()
    const { topic, message, protobufPath, protobufMessageName, protobufFormat } = pubOpts
    basicLog.publishing()
    let bufferMessage = serializeProtobufToBuffer(message, protobufPath, protobufMessageName, protobufFormat)
    client.publish(topic, bufferMessage, pubOpts.opts, (err) => {
      if (err) {
        signale.warn(err)
      } else {
        basicLog.published()
      }
      // FIXME: When using the ws and wss protocols to connect, and QoS is 0, the message may not have been successfully sent when the publish callback is triggered. Therefore, delay closing the connection for 2 seconds.
      if (['ws', 'wss'].includes(connOpts.protocol ?? '') && pubOpts.opts.qos === 0) {
        setTimeout(() => {
          client.end()
        }, 2000)
      } else {
        client.end()
      }
    })
  })
  client.on('error', (err) => {
    basicLog.error(err)
    client.end()
  })
}

const multisend = (
  config: boolean | string | undefined,
  connOpts: IClientOptions,
  pubOpts: {
    topic: string
    message: string | Buffer
    protobufPath: string | undefined
    protobufMessageName: string | undefined
    protobufFormat: FormatType | undefined
    opts: IClientPublishOptions
  },
  maximumReconnectTimes: number,
) => {
  let isNewConnection = true
  let retryTimes = 0
  const client = mqtt.connect(connOpts)
  basicLog.connecting(config, connOpts.hostname!, connOpts.port, pubOpts.topic)
  const sender = new Writable({
    objectMode: true,
  })
  sender._write = (line, _enc, cb) => {
    const { topic, opts, protobufPath, protobufMessageName, protobufFormat } = pubOpts

    let bufferMessage = serializeProtobufToBuffer(line.trim(), protobufPath, protobufMessageName, protobufFormat)
    client.publish(topic, bufferMessage, opts, cb)
  }

  client.on('connect', () => {
    basicLog.enterToPublish()
    retryTimes = 0
    isNewConnection &&
      pump(process.stdin, split2(), sender, (err) => {
        client.end()
        if (err) {
          throw err
        }
      })
  })

  client.on('error', (err) => {
    basicLog.error(err)
    client.end()
  })

  client.on('reconnect', () => {
    retryTimes += 1
    if (retryTimes > maximumReconnectTimes) {
      client.end(false, {}, () => {
        basicLog.reconnectTimesLimit()
        process.exit(1)
      })
    } else {
      basicLog.reconnecting()
      isNewConnection = false
      sender.uncork()
    }
  })

  client.on('close', () => {
    basicLog.close()
    const { reconnectPeriod } = connOpts
    reconnectPeriod ? sender.cork() : process.exit(1)
  })
}

const pub = (options: PublishOptions) => {
  const { save, config } = options

  config && (options = loadConfig('pub', config))

  save && saveConfig('pub', options)

  checkTopicExists(options.topic, 'pub')

  const connOpts = parseConnectOptions(options, 'pub')

  const pubOpts = parsePublishOptions(options)

  if (options.stdin) {
    if (options.multiline) {
      multisend(config, connOpts, pubOpts, options.maximumReconnectTimes)
    } else {
      process.stdin.pipe(
        concat((data) => {
          pubOpts.message = data
          send(config, connOpts, pubOpts)
        }),
      )
    }
  } else {
    send(config, connOpts, pubOpts)
  }
}

const multiPub = async (commandType: CommandType, options: BenchPublishOptions | SimulatePubOptions) => {
  const { save, config } = options

  let simulator: Simulator = {} as Simulator
  if (commandType === 'simulate') {
    options = config ? loadConfig('simulate', config) : options
    save && saveConfig('simulate', options)

    const simulateOptions = options as SimulatePubOptions
    checkScenarioExists(simulateOptions.scenario, simulateOptions.file)
    simulator = loadSimulator(simulateOptions.scenario, simulateOptions.file)
  } else {
    options = config ? loadConfig('benchPub', config) : options
    save && saveConfig('benchPub', options)
  }

  const { count, interval, messageInterval, hostname, port, topic, clientId, message, verbose, maximumReconnectTimes } =
    options

  checkTopicExists(topic, commandType)

  const connOpts = parseConnectOptions(options, 'pub')

  const pubOpts = parsePublishOptions(options)

  const { username } = connOpts

  let connectedCount = 0

  const isNewConnArray = Array(count).fill(true)

  const retryTimesArray = Array(count).fill(0)

  const interactive = new Signale({ interactive: true })
  const simpleInteractive = new Signale({
    interactive: true,
    config: { displayLabel: false, displayDate: true, displayTimestamp: true },
  })

  if (commandType === 'simulate') {
    simulateLog.start.pub(
      config,
      count,
      interval,
      messageInterval,
      hostname,
      port,
      topic,
      simulator.name || simulator.file,
    )
  } else if (commandType === 'benchPub') {
    benchLog.start.pub(config, count, interval, messageInterval, hostname, port, topic, message.toString())
  }

  const connStart = Date.now()

  let total = 0
  let rate = 0

  for (let i = 1; i <= count; i++) {
    ;((i: number, connOpts: mqtt.IClientOptions) => {
      const opts = { ...connOpts }

      opts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

      let topicName = topic.replaceAll('%i', i.toString()).replaceAll('%c', clientId)
      username && (topicName = topicName.replaceAll('%u', username))
      simulator && (topicName = topicName.replaceAll('%sc', simulator.name))

      const client = mqtt.connect(opts)

      interactive.await('[%d/%d] - Connecting...', connectedCount, count)

      client.on('connect', () => {
        connectedCount += 1
        retryTimesArray[i - 1] = 0
        if (isNewConnArray[i - 1]) {
          interactive.success('[%d/%d] - Connected', connectedCount, count)

          setInterval(() => {
            if (!client.connected) {
              return
            }
            let publishTopic = topicName
            let publishMessage = message
            if (commandType === 'simulate') {
              options.clientId = opts.clientId || options.clientId
              const simulationResult = simulator.generator(options as SimulatePubOptions)
              if (simulationResult.topic) {
                publishTopic = simulationResult.topic
              }
              publishMessage = simulationResult.message
            }
            client.publish(publishTopic, publishMessage, pubOpts.opts, (err) => {
              if (err) {
                signale.warn(err)
              } else {
                total += 1
                rate += 1
              }
            })
          }, messageInterval)

          if (connectedCount === count) {
            const connEnd = Date.now()

            signale.info(`Created ${count} connections in ${(connEnd - connStart) / 1000}s`)

            total = 0
            rate = 0

            if (!verbose) {
              setInterval(() => {
                simpleInteractive.info(`Published total: ${total}, message rate: ${rate}/s`)
                rate = 0
              }, 1000)
            } else {
              setInterval(() => {
                signale.info(`Published total: ${total}, message rate: ${rate}/s`)
                rate = 0
              }, 1000)
            }
          }
        } else {
          benchLog.reconnected(connectedCount, count, opts.clientId!)
        }
      })

      client.on('error', (err) => {
        benchLog.error(connectedCount, count, opts.clientId!, err)
        client.end()
      })

      client.on('reconnect', () => {
        retryTimesArray[i - 1] += 1
        if (retryTimesArray[i - 1] > maximumReconnectTimes) {
          client.end(false, {}, () => {
            benchLog.reconnectTimesLimit(connectedCount, count, opts.clientId!)
            if (retryTimesArray.findIndex((times) => times <= maximumReconnectTimes) === -1) {
              process.exit(1)
            }
          })
        } else {
          benchLog.reconnecting(connectedCount, count, opts.clientId!)
          isNewConnArray[i - 1] = false
        }
      })

      client.on('close', () => {
        connectedCount > 0 && (connectedCount -= 1)
        benchLog.close(connectedCount, count, opts.clientId!)
      })
    })(i, connOpts)

    await delay(interval)
  }
}

const benchPub = async (options: BenchPublishOptions) => {
  multiPub('benchPub', options)
}

const simulatePub = async (options: SimulatePubOptions) => {
  multiPub('simulate', options)
}

export default pub

export { pub, benchPub, simulatePub }
