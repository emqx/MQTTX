import concat from 'concat-stream'
import * as Debug from 'debug'
import _ from 'lodash'
import * as mqtt from 'mqtt'
import { IClientOptions, IClientPublishOptions } from 'mqtt'
import pump from 'pump'
import { Writable } from 'readable-stream'
import split2 from 'split2'
import convertPayload from '../utils/convertPayload'
import delay from '../utils/delay'
import { fileDataSplitter, processPath, readFile } from '../utils/fileUtils'
import logWrapper, { basicLog, benchLog, Signale, signale, simulateLog, singaleConfig } from '../utils/logWrapper'
import { handleLoadOptions, handleSaveOptions } from '../utils/options'
import { checkScenarioExists, checkTopicExists, parseConnectOptions, parsePublishOptions } from '../utils/parse'
import { serializeProtobufToBuffer } from '../utils/protobuf'
import { serializeAvroToBuffer } from '../utils/avro'
import { loadSimulator } from '../utils/simulate'
import { triggerExitInfo } from '../utils/exitInfo'
import getBenchClientId from '../utils/getBenchClientId'

/**
 * Processes the outgoing message through two potential stages:
 * 1. Format Conversion: If a format is specified, transform the message into that format.
 *    If no format is specified, the message retains its initial state.
 * 2. Protobuf Serialization: If both protobuf path and message name are present,
 *    encapsulate the message into a protobuf format. If these settings are absent,
 *    the message remains unchanged.
 * Flow:
 *   Input Message -> [Format Conversion] -> Schema [Protobuf, Avro] -> Output Message
 * @param {string | Buffer} message - The message to be processed.
 * @param {SchemaOptions} [schemaOptions] - Options for schema-based encoding
 * @param {FormatType} [format] - The format to convert the message to.
 * @returns {Buffer | string} - The processed message.
 */
const processPublishMessage = (
  message: string | Buffer,
  schemaOptions?: SchemaOptions,
  format?: FormatType,
): Buffer | string => {
  const convertMessageFormat = (msg: string | Buffer): string | Buffer => {
    if (!format) {
      return msg
    }
    const bufferMsg = Buffer.isBuffer(msg) ? msg : Buffer.from(msg.toString())
    return convertPayload(bufferMsg, format, 'encode')
  }

  const serializeWithSchema = (msg: string | Buffer): string | Buffer => {
    if (!schemaOptions) return msg

    switch (schemaOptions.type) {
      case 'protobuf':
        return serializeProtobufToBuffer(msg, schemaOptions.protobufPath, schemaOptions.protobufMessageName)

      case 'avro':
        return serializeAvroToBuffer(msg, schemaOptions.avscPath)
    }
  }

  const pipeline = [convertMessageFormat, serializeWithSchema]

  return pipeline.reduce((msg: string | Buffer, transformer) => transformer(msg), message) as Buffer
}

const send = (
  config: boolean | string | undefined,
  connOpts: IClientOptions,
  pubOpts: {
    topic: string
    message: string | Buffer
    schemaOptions?: SchemaOptions
    format?: FormatType
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
    const { topic, message, schemaOptions, format } = pubOpts
    basicLog.publishing()
    const publishMessage = processPublishMessage(message, schemaOptions, format)
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
    schemaOptions?: SchemaOptions
    format?: FormatType
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
    const { topic, opts, schemaOptions, format } = pubOpts
    count++
    let omitTopic = opts.properties?.topicAlias && count >= 2
    const publishMessage = processPublishMessage(line.trim(), schemaOptions, format)
    client.publish(omitTopic ? '' : topic, publishMessage, opts, cb)
  }

  client.on('connect', () => {
    basicLog.enterToPublish()
    setTimeout(triggerExitInfo, 1000)
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

const handlePipedMultiline = (connOpts: IClientOptions, pubOpts: { topic: string; opts: IClientPublishOptions }) => {
  const client = mqtt.connect(connOpts)
  let messageQueue: string[] = []
  let publishedCount = 0

  process.stdin.pipe(split2()).on('data', (chunk) => {
    const message = chunk.toString()
    if (message.length > 0) {
      messageQueue.push(message)
    }
  })

  client.on('connect', () => {
    basicLog.connected()
    if (messageQueue.length > 0) {
      logWrapper.await(`Publishing ${messageQueue.length} messages...`)
      messageQueue.forEach((message) => {
        client.publish(pubOpts.topic, Buffer.from(message), pubOpts.opts, (err) => {
          if (err) {
            basicLog.error(err)
          } else {
            publishedCount++
            if (publishedCount === messageQueue.length) {
              logWrapper.success(`Successfully published ${publishedCount} messages`)
            }
          }
        })
      })
      setTimeout(() => {
        client.end()
      }, 1000)
    }
  })

  client.on('error', (err) => {
    basicLog.error(err)
    client.end()
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

  loadOptions && (options = handleLoadOptions('pub', loadOptions, options))

  saveOptions && handleSaveOptions('pub', options)

  debug && Debug.enable('mqttjs*')

  checkTopicExists(options.topic, 'pub')

  if (options.lineMode) {
    options.multiline = true
    options.stdin = true
  }

  const connOpts = parseConnectOptions(options, 'pub')

  const pubOpts = parsePublishOptions(options)

  const handleStdin = () => {
    // One line mode
    if (!options.multiline) {
      return process.stdin.pipe(
        concat((data) => {
          pubOpts.message = data
          send(loadOptions, connOpts, pubOpts, options.maximumReconnectTimes)
        }),
      )
    }

    // Multiline mode
    const isPiped = !process.stdin.isTTY
    return isPiped
      ? handlePipedMultiline(connOpts, pubOpts)
      : multiSend(loadOptions, connOpts, pubOpts, options.maximumReconnectTimes)
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
    options = loadOptions ? handleLoadOptions('simulate', loadOptions, options as SimulatePubOptions) : options
    saveOptions && handleSaveOptions('simulate', options)

    const simulateOptions = options as SimulatePubOptions
    checkScenarioExists(simulateOptions.scenario, simulateOptions.file)
    simulator = loadSimulator(simulateOptions.scenario, simulateOptions.file)
  } else {
    options = loadOptions ? handleLoadOptions('benchPub', loadOptions, options as BenchPublishOptions) : options
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

      opts.clientId = getBenchClientId(clientId, i, count)

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
