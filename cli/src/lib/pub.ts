import concat from 'concat-stream'
import * as Debug from 'debug'
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
import {
  checkScenarioExists,
  checkTopicExists,
  parseConnectOptions,
  parsePublishOptions,
  validateClientCount,
  validateMaxInflight,
} from '../utils/parse'
import { serializeProtobufToBuffer } from '../utils/protobuf'
import { serializeAvroToBuffer } from '../utils/avro'
import { loadSimulator } from '../utils/simulate'
import { triggerExitInfo } from '../utils/exitInfo'
import getBenchClientId from '../utils/getBenchClientId'
import createRateSampler from '../utils/createRateSampler'
import { parsePayloadSize, generateRandomPayload } from '../utils/payloadGenerator'
import { createMqttClient } from '../utils/mqttConnect'
import {
  DEFAULT_MAX_INFLIGHT,
  DEFAULT_MQTT_PUB_MESSAGE,
  MAX_INFLIGHT_LIMIT,
  SIGINT_EXIT_CODE,
} from '../utils/constants'
import shouldRetryConnectionError from '../utils/shouldRetryConnectionError'
import { checkBatchOptions, addBatchOffer, createBatchSelectionCheck } from '../utils/batchOptions'
import {
  BatchPacket,
  buildTopicCarrier,
  calculatePublishSize,
  encodeBatchPayload,
  DEFAULT_BATCH_LIMITS,
  PROTOCOL_BATCH_LIMITS,
} from '../utils/batchPublishing'

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

const exitWithPublishError = (client: mqtt.MqttClient, err: Error) => {
  basicLog.error(err)
  process.exitCode = 1
  // Do not wait for queued QoS messages or open stdin after a terminal failure.
  client.end(true, {}, () => process.exit(1))
}

const makeBatchPacket = (options: PublishOptions, payload: Buffer, count: number): BatchPacket => {
  const { opts } = parsePublishOptions(options)
  return {
    topic: options.mqttVersion === 4 ? buildTopicCarrier(count, options.topic) : options.topic,
    payload,
    ...opts,
    properties:
      options.mqttVersion === 5
        ? {
            ...opts.properties,
            userProperties: { ...opts.properties?.userProperties, 'batch-format': 'v1', 'batch-size': String(count) },
          }
        : undefined,
  }
}

const checkBatchPacketSize = (packet: BatchPacket, version: number, maximum?: number) => {
  const bytes = calculatePublishSize(packet, version)
  if (maximum !== undefined && bytes > maximum) {
    throw new Error(
      `Batch packet too large: ${bytes} bytes exceeds broker Maximum Packet Size ${maximum}; no batch sent.`,
    )
  }
}

// MQTT.js 4 replays its outgoing store BEFORE emitting connect. packetreceive runs
// before _handleConnack, so closing here blocks replay after a failed §2.1 selection.
const watchBatchConnection = (client: mqtt.MqttClient, options: PublishOptions, packets: BatchPacket[]) => {
  const checkSelection = createBatchSelectionCheck(options.connUserProperties, options.batchNegotiate)
  client.on('packetreceive', (packet) => {
    if (packet.cmd !== 'connack' || (packet.reasonCode ?? packet.returnCode) !== 0) return
    try {
      const selected = checkSelection(packet)
      packets.forEach((batch) => checkBatchPacketSize(batch, options.mqttVersion, packet.properties?.maximumPacketSize))
      if (selected) logWrapper.success('Batch negotiation selected: v1 (QoS 0/1).')
    } catch (error) {
      exitWithPublishError(client, error as Error)
    }
  })
}

const sendBatches = (options: PublishOptions, packets: BatchPacket[]) => {
  if (packets.length === 0) {
    logWrapper.success('No batch items to publish.')
    return
  }
  const connOpts = parseConnectOptions(options, 'pub')
  const client = createMqttClient(connOpts)
  watchBatchConnection(client, options, packets)
  let retryTimes = 0
  let started = false
  let complete = false
  let pending = false
  let index = 0
  basicLog.connecting(options.loadOptions, connOpts.hostname!, connOpts.port, options.topic)
  client.on('connect', (packet) => {
    if (client.disconnecting) return
    retryTimes = 0
    basicLog.connected()
    basicLog.responseInformation(connOpts, packet)
    if (started) return
    started = true
    const next = () => {
      if (client.disconnecting) return
      const batch = packets[index]
      let settled = false
      pending = true
      client.publish(batch.topic, batch.payload, batch as IClientPublishOptions, (err) => {
        // MQTT.js 4 calls back again when deleting a rejected outgoing packet.
        if (settled) return
        settled = true
        pending = false
        if (err) return exitWithPublishError(client, err)
        index++
        // QoS 0 callbacks can run synchronously; keep large files off the call stack.
        if (index < packets.length) return setImmediate(next)
        complete = true
        basicLog.published()
        if (['ws', 'wss'].includes(connOpts.protocol ?? '') && options.qos === 0) {
          setTimeout(() => client.end(), 2000)
        } else {
          client.end()
        }
      })
    }
    next()
  })
  client.on('error', (err) => exitWithPublishError(client, err))
  client.on('close', () => {
    // MQTT.js cannot replay a QoS 0 callback waiting for the old stream to drain.
    if (!complete && pending && options.qos === 0 && !client.disconnecting) {
      return exitWithPublishError(client, new Error('Connection closed before batch publishing completed'))
    }
    if (!complete && !connOpts.reconnectPeriod) process.exit(1)
  })
  client.on('reconnect', () => {
    retryTimes++
    if (retryTimes > options.maximumReconnectTimes) {
      client.end(true, {}, () => {
        basicLog.reconnectTimesLimit()
        process.exit(1)
      })
    } else basicLog.reconnecting(retryTimes, options.maximumReconnectTimes)
  })
  client.on('disconnect', (packet: IDisconnectPacket) => basicLog.disconnect(packet))
}

const publishBatches = (options: PublishOptions) => {
  try {
    const limits = {
      maxItems: options.batchMaxItems ?? DEFAULT_BATCH_LIMITS.maxItems,
      maxBytes: options.batchMaxBytes ?? DEFAULT_BATCH_LIMITS.maxBytes,
    }
    const source = options.fileRead
      ? fileDataSplitter(handleFileRead(processPath(options.fileRead)), options.split || true, true)
      : options.batchMessages ?? [options.message]
    const packets: BatchPacket[] = []
    let items: Buffer[] = []
    let bytes = 0
    const flush = () => {
      if (items.length) packets.push(makeBatchPacket(options, encodeBatchPayload(items, limits), items.length))
      items = []
      bytes = 0
    }
    source.forEach((item, index) => {
      const message = processPublishMessage(item, undefined, options.format)
      const buffer = Buffer.isBuffer(message) ? message : Buffer.from(message)
      if (buffer.length > 65535 || buffer.length + 2 > limits.maxBytes) {
        throw new Error(`Batch input error: item ${index + 1}; exceeds item or payload byte limit; no batch sent.`)
      }
      if (items.length === limits.maxItems || bytes + buffer.length + 2 > limits.maxBytes) flush()
      items.push(buffer)
      bytes += buffer.length + 2
    })
    flush()
    packets.forEach((packet) => checkBatchPacketSize(packet, options.mqttVersion))
    sendBatches(options, packets)
  } catch (error) {
    basicLog.error(error as Error)
    process.exit(1)
  }
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
  let publishComplete = false

  const client = createMqttClient(connOpts)
  basicLog.connecting(config, connOpts.hostname!, connOpts.port, pubOpts.topic, pubOpts.message.toString())

  client.on('connect', (packet) => {
    retryTimes = 0
    basicLog.connected()
    basicLog.responseInformation(connOpts, packet)
    const { topic, message, schemaOptions, format } = pubOpts
    basicLog.publishing()
    const publishMessage = processPublishMessage(message, schemaOptions, format)
    client.publish(topic, publishMessage, pubOpts.opts, (err) => {
      if (err) {
        basicLog.error(err)
        process.exit(1)
      } else {
        publishComplete = true
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
    exitWithPublishError(client, err)
  })

  client.on('close', () => {
    if (!publishComplete && !connOpts.reconnectPeriod) {
      process.exit(1)
    }
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

  const client = createMqttClient(connOpts)
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

  client.on('connect', (packet) => {
    basicLog.enterToPublish()
    basicLog.responseInformation(connOpts, packet)
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
    exitWithPublishError(client, err)
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
  const client = createMqttClient(connOpts)
  const messageQueue: string[] = []
  let publishedCount = 0
  let failed = false
  const publishComplete = () => publishedCount > 0 && publishedCount === messageQueue.length
  const fail = (err: Error) => {
    if (failed) return
    failed = true
    exitWithPublishError(client, err)
  }
  const failIncompletePublish = () => fail(new Error('Connection closed before publishing completed'))

  process.stdin.pipe(split2()).on('data', (chunk) => {
    const message = chunk.toString()
    if (message.length > 0) {
      messageQueue.push(message)
    }
  })

  client.on('connect', (packet) => {
    basicLog.connected()
    basicLog.responseInformation(connOpts, packet)
    if (messageQueue.length > 0) {
      logWrapper.await(`Publishing ${messageQueue.length} messages...`)
      messageQueue.forEach((message) => {
        client.publish(pubOpts.topic, Buffer.from(message), pubOpts.opts, (err) => {
          // MQTT.js can invoke a publish callback again while removing a rejected packet.
          if (failed) return
          if (err) return fail(err)
          publishedCount++
          if (publishComplete()) {
            logWrapper.success(`Successfully published ${publishedCount} messages`)
          }
        })
      })
      setTimeout(() => {
        // Ending a disconnected client cancels any scheduled reconnect.
        if (!client.connected && !publishComplete()) return failIncompletePublish()
        client.end()
      }, 1000)
    }
  })

  client.on('error', fail)

  client.on('close', () => {
    if (!publishComplete() && (!connOpts.reconnectPeriod || client.disconnecting)) {
      failIncompletePublish()
    }
  })
}

/**
 * Read file content and return as Buffer
 * @param filePath - Path to the file to read
 * @returns Buffer containing file data
 * @throws Process exits with code 1 if file reading fails
 */
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

/**
 * Generate random payload based on payloadSize option
 * @param payloadSize - Size string like "1KB", "2MB"
 * @returns Generated Buffer or null if invalid
 */
const handlePayloadSizeGeneration = (payloadSize: string): Buffer | null => {
  if (!payloadSize) {
    return null
  }

  try {
    const sizeInBytes = parsePayloadSize(payloadSize)
    const payload = generateRandomPayload(sizeInBytes)
    logWrapper.success(`Generated random payload of ${payloadSize}.`)
    return payload
  } catch (error: any) {
    logWrapper.fail(`Failed to generate payload: ${error.message}`)
    process.exit(1)
  }
}

const pub = (options: PublishOptions) => {
  const { debug, saveOptions, loadOptions } = options

  loadOptions && (options = handleLoadOptions('pub', loadOptions, options))

  saveOptions && handleSaveOptions('pub', options)

  debug && Debug.enable('mqttjs*')

  checkTopicExists(options.topic, 'pub')
  checkBatchOptions(options, 'pub')
  addBatchOffer(options)
  if (options.batch) return publishBatches(options)

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
  } else if (options.payloadSize && options.message === DEFAULT_MQTT_PUB_MESSAGE) {
    const generatedPayload = handlePayloadSizeGeneration(options.payloadSize)
    if (generatedPayload) {
      pubOpts.message = generatedPayload
    }
    send(loadOptions, connOpts, pubOpts, options.maximumReconnectTimes)
  } else {
    send(loadOptions, connOpts, pubOpts, options.maximumReconnectTimes)
  }
}

const multiPub = async (commandType: 'benchPub' | 'simulate', options: BenchPublishOptions | SimulatePubOptions) => {
  const { saveOptions, loadOptions } = options

  if (loadOptions) {
    options =
      commandType === 'simulate'
        ? handleLoadOptions('simulate', loadOptions, options as SimulatePubOptions)
        : handleLoadOptions('benchPub', loadOptions, options)
  }
  validateClientCount(options.count)
  const { maxInflight = DEFAULT_MAX_INFLIGHT } = options
  validateMaxInflight(maxInflight)
  saveOptions && handleSaveOptions(commandType, options)

  let simulator: Simulator = {} as Simulator
  if (commandType === 'simulate') {
    const simulateOptions = options as SimulatePubOptions
    checkScenarioExists(simulateOptions.scenario, simulateOptions.file)
    simulator = loadSimulator(simulateOptions.scenario, simulateOptions.file)
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
  let splitMessages: readonly string[] = []
  if (fileRead) {
    fileData = handleFileRead(processPath(fileRead))
    if (split) {
      splitMessages = fileDataSplitter(fileData, split)
    }
  }

  checkTopicExists(topic, commandType)
  if (commandType === 'benchPub') {
    checkBatchOptions(options, 'benchPub')
    addBatchOffer(options)
  }

  const connOpts = parseConnectOptions(options, 'pub')

  const pubOpts = parsePublishOptions(options)

  // Handle payload size generation for bench/simulate mode
  let generatedPayload: Buffer | null = null
  if (options.payloadSize && !fileRead && options.message === DEFAULT_MQTT_PUB_MESSAGE) {
    generatedPayload = handlePayloadSizeGeneration(options.payloadSize)
  }

  const batchItems = options.batch ? options.batchItems ?? 100 : undefined
  let batchPayload: Buffer | undefined
  if (batchItems !== undefined) {
    try {
      const template = fileRead ? fileData! : generatedPayload ?? message
      const item = Buffer.isBuffer(template) ? template : Buffer.from(template)
      batchPayload = encodeBatchPayload(Array(batchItems).fill(item), PROTOCOL_BATCH_LIMITS)
    } catch (error) {
      basicLog.error(error as Error)
      process.exit(1)
    }
  }

  const { username } = connOpts

  let initialized = false
  let exiting = false

  let connectedCount = 0

  let exhaustedCount = 0

  let inFlightMessageCount = 0
  let hasReportedInflightLimit = false

  const splitLimit = splitMessages.length * count

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
  let failed = 0
  const batchStats = () => `Published total: ${total * batchItems!} items (${total} packets), failed: ${failed} packets`
  const reachedLimit = () => limit > 0 && total + failed >= limit
  const finishedSplit = () => splitLimit > 0 && total + failed >= splitLimit
  let readyAt: bigint | undefined

  process.once('SIGINT', () => {
    const elapsed = readyAt === undefined ? 0 : Number(process.hrtime.bigint() - readyAt) / 1e9
    logWrapper.log(
      batchItems !== undefined
        ? `${batchStats()}, elapsed: ${elapsed.toFixed(2)}s`
        : `Published total: ${total}${failed > 0 ? `, failed: ${failed}` : ''}, elapsed: ${elapsed.toFixed(2)}s`,
    )
    process.exit(SIGINT_EXIT_CODE)
  })

  for (let i = 1; i <= count; i++) {
    let splitMessageIndex = 0

    ;((i: number, connOpts: mqtt.IClientOptions) => {
      const opts = { ...connOpts }

      opts.clientId = getBenchClientId(clientId, i, count)

      let topicName = topic.replaceAll('%i', i.toString()).replaceAll('%c', opts.clientId)
      username && (topicName = topicName.replaceAll('%u', username))
      commandType === 'simulate' && (topicName = topicName.replaceAll('%sc', simulator.name))

      let batchPacket: BatchPacket | undefined
      if (batchPayload) {
        try {
          batchPacket = makeBatchPacket({ ...options, topic: topicName }, batchPayload, batchItems!)
          checkBatchPacketSize(batchPacket, options.mqttVersion)
        } catch (error) {
          basicLog.error(error as Error)
          process.exit(1)
        }
      }
      const client = createMqttClient(opts)
      if (batchPacket) watchBatchConnection(client, options, [batchPacket])
      let hasConnected = false
      let isConnected = false
      let retryTimes = 0
      let clientInFlightMessageCount = 0
      const pendingQos0 = new Set<(err?: Error) => void>()

      interactivePub.await('[%d/%d] - Connecting...', connectedCount, count)

      client.on('connect', () => {
        if (client.disconnecting) return
        connectedCount += 1
        isConnected = true
        retryTimes = 0
        if (!hasConnected) {
          hasConnected = true
          interactivePub.success('[%d/%d] - Connected', connectedCount, count)

          setInterval(async () => {
            if (exiting) {
              return
            }
            const sent = total + failed
            const limitReached = reachedLimit()
            // If the message or segmented file limit is reached, exit the process.
            if (limitReached || finishedSplit()) {
              exiting = true
              // Wait for the total number of sent messages to be printed, then exit the process.
              await delay(1000)
              if (batchItems !== undefined) {
                failed > 0 ? logWrapper.fail(batchStats()) : logWrapper.success(batchStats())
              } else if (failed > 0) {
                logWrapper.fail(`${failed} of ${sent} messages failed to publish.`)
              } else if (limitReached) {
                logWrapper.success(`All ${total} messages have been sent, reaching the limit of ${limit}.`)
              } else {
                logWrapper.success(`All ${total} messages from the ${fileRead} have been successfully sent.`)
              }
              process.exit(failed > 0 ? 1 : 0)
            }
            // If not initialized or client is not connected or message count exceeds the limit, do not send messages.
            if (
              !initialized ||
              !client.connected ||
              (limit > 0 && sent + inFlightMessageCount >= limit) ||
              (splitLimit > 0 && sent + inFlightMessageCount >= splitLimit)
            ) {
              return
            }
            if (clientInFlightMessageCount >= maxInflight) {
              if (!hasReportedInflightLimit) {
                hasReportedInflightLimit = true
                logWrapper.log(
                  `Waiting for acknowledgements: in-flight limit ${maxInflight} per connection reached. Use --max-inflight to raise it (max ${MAX_INFLIGHT_LIMIT}).`,
                )
              }
              return
            }
            let publishTopic = topicName
            let publishMessage = message

            // Use generated payload if available and no other message source
            if (generatedPayload && !fileRead && commandType !== 'simulate') {
              publishMessage = generatedPayload
            }

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
                if (splitMessageIndex >= splitMessages.length) {
                  return
                }
                publishMessage = Buffer.from(splitMessages[splitMessageIndex++])
              }
            }
            inFlightMessageCount += 1
            clientInFlightMessageCount += 1
            let completed = false
            const onPublish = (err?: Error) => {
              if (completed) {
                return
              }
              completed = true
              pendingQos0.delete(onPublish)
              inFlightMessageCount -= 1
              clientInFlightMessageCount -= 1
              if (err) {
                failed += 1
                basicLog.error(err)
              } else {
                total += 1
              }
            }
            if (pubOpts.opts.qos === 0) {
              pendingQos0.add(onPublish)
            }
            client.publish(
              batchPacket?.topic ?? publishTopic,
              batchPacket?.payload ?? publishMessage,
              batchPacket ? (batchPacket as IClientPublishOptions) : pubOpts.opts,
              onPublish,
            )
          }, messageInterval)
        } else {
          benchLog.reconnected(connectedCount, count, opts.clientId!)
        }

        if (connectedCount === count && !initialized) {
          initialized = true
          readyAt = process.hrtime.bigint()
          const connEnd = Date.now()
          signale.success(`Created ${count} connections in ${(connEnd - connStart) / 1000}s`)

          const sampleRate = createRateSampler()
          setInterval(() => {
            const rate = sampleRate(total)
            const logMethod = verbose ? logWrapper.log : interactivePub.log
            logMethod(
              batchItems !== undefined
                ? `${batchStats()}, rate: ${rate * batchItems} items/s (${rate} packets/s)`
                : `Published total: ${total}, message rate: ${rate}/s`,
            )
          }, 1000)
        }
      })

      client.on('error', (err) => {
        benchLog.error(connectedCount, count, opts.clientId!, err)
        if (!shouldRetryConnectionError(err, opts.reconnectPeriod)) {
          client.end(true, {}, () => {
            if (!reachedLimit() && !finishedSplit()) process.exit(1)
          })
        }
      })

      client.on('reconnect', () => {
        retryTimes += 1
        benchLog.reconnecting(connectedCount, count, opts.clientId!)
      })

      client.on('close', () => {
        // MQTT.js does not flush QoS 0 callbacks waiting for the old stream to drain.
        pendingQos0.forEach((callback) => callback(new Error('Connection closed')))
        if (isConnected) {
          connectedCount -= 1
          isConnected = false
        }
        benchLog.close(connectedCount, count, opts.clientId!)
        if (client.disconnecting) return
        if (reachedLimit() || finishedSplit()) {
          client.end(true)
          return
        }
        if ((client.options.reconnectPeriod ?? 0) <= 0) process.exit(1)
        if (retryTimes + 1 > maximumReconnectTimes) {
          client.end(true, {}, () => {
            benchLog.reconnectTimesLimit(connectedCount, count, opts.clientId!)
            exhaustedCount += 1
            if (!initialized || exhaustedCount === count) process.exit(1)
          })
        }
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
