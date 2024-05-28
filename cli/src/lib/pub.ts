import * as mqtt from 'mqtt'
import pump from 'pump'
import concat from 'concat-stream'
import { Writable } from 'readable-stream'
import split2 from 'split2'
import { IClientOptions, IClientPublishOptions } from 'mqtt'
import logWrapper, { Signale, basicLog, benchLog, simulateLog, singaleConfig, signale } from '../utils/logWrapper'
import { parseConnectOptions, parsePublishOptions, checkTopicExists, checkScenarioExists } from '../utils/parse'
import delay from '../utils/delay'
import { handleSaveOptions, handleLoadOptions } from '../utils/options'
import { loadSimulator } from '../utils/simulate'
import { serializeProtobufToBuffer } from '../utils/protobuf'
import { readFile, processPath, fileDataSplitter } from '../utils/fileUtils'
import convertPayload from '../utils/convertPayload'
import * as Debug from 'debug'
import _ from 'lodash'

const processPublishMessage = (
  message: string | Buffer,
  protobufPath?: string,
  protobufMessageName?: string,
  format?: FormatType,
): Buffer | string => {
  /*
   * Pipeline for processing outgoing messages in two potential stages:
   * 1. Format Conversion --> Applied if a format is specified, transforming the message into that format; if absent, the message retains its initial state.
   * 2. Protobuf Serialization --> Engaged if both protobuf path and message name are present, encapsulating the message into a protobuf format; without these settings, the message circulates unchanged.
   */
  const pipeline = [
    (msg: string | Buffer) => (format ? convertPayload(Buffer.from(msg.toString()), format, 'encode') : msg),
    (msg: string | Buffer) =>
      protobufPath && protobufMessageName
        ? serializeProtobufToBuffer(msg.toString(), protobufPath, protobufMessageName)
        : msg,
  ]

  return pipeline.reduce((msg, transformer) => transformer(msg), message) as Buffer
}

const send = (
  config: boolean | string | undefined,
  connOpts: IClientOptions,
  pubOpts: {
    topic: string
    message: string | Buffer
    protobufPath: string | undefined
    protobufMessageName: string | undefined
    format: FormatType | undefined
    opts: IClientPublishOptions
  },
  maximumReconnectTimes: number,
) => {
  let retryTimes = 0
  let isNewConnection = true
  const client = mqtt.connect(connOpts)
  basicLog.connecting(config, connOpts.hostname!, connOpts.port, pubOpts.topic, pubOpts.message.toString())

  client.on('connect', () => {
    retryTimes = 0
    basicLog.connected()
    const { topic, message, protobufPath, protobufMessageName, format } = pubOpts
    basicLog.publishing()
    const publishMessage = processPublishMessage(message, protobufPath, protobufMessageName, format)
    client.publish(topic, publishMessage, pubOpts.opts, (err) => {
      if (err) {
        basicLog.error(err)
        process.exit(1)
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

  client.on('reconnect', () => {
    retryTimes += 1
    if (retryTimes > maximumReconnectTimes) {
      client.end(true, {}, () => {
        basicLog.reconnectTimesLimit()
        process.exit(1)
      })
    } else {
      basicLog.reconnecting(retryTimes, maximumReconnectTimes)
      isNewConnection = false
    }
  })

  client.on('close', () => {
    basicLog.close()
  })

  client.on('disconnect', (packet: IDisconnectPacket) => {
    basicLog.disconnect(packet)
  })
}

const multiSend = (
  config: boolean | string | undefined,
  connOpts: IClientOptions,
  pubOpts: {
    topic: string
    message: string | Buffer
    protobufPath: string | undefined
    protobufMessageName: string | undefined
    format: FormatType | undefined
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
  let count = 0
  sender._write = (line, _enc, cb) => {
    const { topic, opts, protobufPath, protobufMessageName, format } = pubOpts
    count++
    let omitTopic = opts.properties?.topicAlias && count >= 2
    const publishMessage = processPublishMessage(line.trim(), protobufPath, protobufMessageName, format)
    client.publish(omitTopic ? '' : topic, publishMessage, opts, cb)
  }

  client.on('connect', () => {
    basicLog.enterToPublish()
    retryTimes = 0
    isNewConnection &&
      pump(process.stdin, split2(), sender, (err) => {
        client.end()
        if (err) {
          basicLog.error(err)
          process.exit(1)
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
      client.end(true, {}, () => {
        basicLog.reconnectTimesLimit()
        process.exit(1)
      })
    } else {
      basicLog.reconnecting(retryTimes, maximumReconnectTimes)
      isNewConnection = false
      sender.uncork()
    }
  })

  client.on('close', () => {
    basicLog.close()
    const { reconnectPeriod } = connOpts
    reconnectPeriod ? sender.cork() : process.exit(1)
  })

  client.on('disconnect', (packet: IDisconnectPacket) => {
    basicLog.disconnect(packet)
  })
}

const handleFileRead = (filePath: string) => {
  try {
    basicLog.fileReading()
    const bufferData = readFile(filePath)
    basicLog.fileReadSuccess()
    return bufferData
  } catch (err) {
    const error = err as Error
    logWrapper.fail(`Failed to read file: ${error.toString()}`)
    process.exit(1)
  }
}

const pub = (options: PublishOptions) => {
  const { debug, saveOptions, loadOptions } = options

  loadOptions && (options = handleLoadOptions('pub', loadOptions))

  saveOptions && handleSaveOptions('pub', options)

  debug && Debug.enable('mqttjs*')

  checkTopicExists(options.topic, 'pub')

  const connOpts = parseConnectOptions(options, 'pub')

  const pubOpts = parsePublishOptions(options)

  const handleStdin = () => {
    if (options.multiline) {
      multiSend(loadOptions, connOpts, pubOpts, options.maximumReconnectTimes)
    } else {
      process.stdin.pipe(
        concat((data) => {
          pubOpts.message = data
          send(loadOptions, connOpts, pubOpts, options.maximumReconnectTimes)
        }),
      )
    }
  }

  if (options.fileRead) {
    const bufferData = handleFileRead(processPath(options.fileRead!))
    pubOpts.message = bufferData
    send(loadOptions, connOpts, pubOpts, options.maximumReconnectTimes)
  } else if (options.stdin) {
    handleStdin()
  } else {
    send(loadOptions, connOpts, pubOpts, options.maximumReconnectTimes)
  }
}

const multiPub = async (commandType: CommandType, options: BenchPublishOptions | SimulatePubOptions) => {
  const { saveOptions, loadOptions } = options

  let simulator: Simulator = {} as Simulator
  if (commandType === 'simulate') {
    options = loadOptions ? handleLoadOptions('simulate', loadOptions) : options
    saveOptions && handleSaveOptions('simulate', options)

    const simulateOptions = options as SimulatePubOptions
    checkScenarioExists(simulateOptions.scenario, simulateOptions.file)
    simulator = loadSimulator(simulateOptions.scenario, simulateOptions.file)
  } else {
    options = loadOptions ? handleLoadOptions('benchPub', loadOptions) : options
    saveOptions && handleSaveOptions('benchPub', options)
  }

  const {
    count,
    interval,
    messageInterval,
    limit,
    hostname,
    port,
    topic,
    clientId,
    message,
    fileRead,
    verbose,
    maximumReconnectTimes,
    split,
  } = options

  // File Handler
  let fileData: Buffer | string
  let splitedMessageArr: string[] = []
  if (fileRead) {
    fileData = handleFileRead(processPath(fileRead))
    if (split) {
      splitedMessageArr = fileDataSplitter(fileData, split)
    }
  }

  checkTopicExists(topic, commandType)

  const connOpts = parseConnectOptions(options, 'pub')

  const pubOpts = parsePublishOptions(options)

  const { username } = connOpts

  let initialized = false

  let connectedCount = 0

  let inFlightMessageCount = 0

  const splitLimit = splitedMessageArr.length * count

  const isNewConnArray = Array(count).fill(true)

  const retryTimesArray = Array(count).fill(0)

  const interactivePub = new Signale({ interactive: true, config: singaleConfig })

  if (commandType === 'simulate') {
    simulateLog.start.pub(
      loadOptions,
      count,
      interval,
      messageInterval,
      hostname,
      port,
      topic,
      simulator.name || simulator.file,
    )
  } else if (commandType === 'benchPub') {
    benchLog.start.pub(loadOptions, count, interval, messageInterval, hostname, port, topic, message.toString())
  }

  const connStart = Date.now()

  let total = 0
  let rate = 0

  for (let i = 1; i <= count; i++) {
    // Duplicate splited messages array for each connection
    const dupSplitedMessageArr = splitedMessageArr.length !== 0 ? _.cloneDeep(splitedMessageArr) : []

    ;((i: number, connOpts: mqtt.IClientOptions) => {
      const opts = { ...connOpts }

      opts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

      let topicName = topic.replaceAll('%i', i.toString()).replaceAll('%c', clientId)
      username && (topicName = topicName.replaceAll('%u', username))
      simulator && (topicName = topicName.replaceAll('%sc', simulator.name))

      const client = mqtt.connect(opts)

      interactivePub.await('[%d/%d] - Connecting...', connectedCount, count)

      client.on('connect', () => {
        connectedCount += 1
        retryTimesArray[i - 1] = 0
        if (isNewConnArray[i - 1]) {
          interactivePub.success('[%d/%d] - Connected', connectedCount, count)

          setInterval(async () => {
            // If the number of messages sent exceeds the limit, exit the process.
            if (limit > 0 && total >= limit) {
              // Wait for the total number of sent messages to be printed, then exit the process.
              await delay(1000)
              logWrapper.success(`All ${total} messages have been sent, reaching the limit of ${limit}.`)
              process.exit(0)
            }
            // If the segmented message has been completely sent, exit the process.
            if (splitLimit > 0 && total >= splitLimit) {
              // Wait for the total number of sent messages to be printed, then exit the process.
              await delay(1000)
              logWrapper.success(`All ${total} messages from the ${fileRead} have been successfully sent.`)
              process.exit(0)
            }
            // If not initialized or client is not connected or message count exceeds the limit, do not send messages.
            if (
              !initialized ||
              !client.connected ||
              (limit > 0 && total + inFlightMessageCount >= limit) ||
              (splitLimit > 0 && total + inFlightMessageCount >= splitLimit)
            ) {
              return
            }
            inFlightMessageCount += 1
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
            if (fileRead) {
              if (!split) {
                publishMessage = fileData
              } else {
                if (dupSplitedMessageArr.length === 0) {
                  return
                }
                publishMessage = Buffer.from(dupSplitedMessageArr.shift()!)
              }
            }
            client.publish(publishTopic, publishMessage, pubOpts.opts, (err) => {
              inFlightMessageCount -= 1
              if (err) {
                basicLog.error(err)
              } else {
                total += 1
                rate += 1
              }
            })
          }, messageInterval)

          if (connectedCount === count) {
            initialized = true

            const connEnd = Date.now()

            signale.success(`Created ${count} connections in ${(connEnd - connStart) / 1000}s`)

            if (!verbose) {
              setInterval(() => {
                interactivePub.log(`Published total: ${total}, message rate: ${rate}/s`)
                rate = 0
              }, 1000)
            } else {
              setInterval(() => {
                logWrapper.log(`Published total: ${total}, message rate: ${rate}/s`)
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

      client.on('disconnect', (packet: IDisconnectPacket) => {
        basicLog.disconnect(packet, opts.clientId!)
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
