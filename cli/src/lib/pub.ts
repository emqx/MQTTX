import concat from 'concat-stream'
import * as Debug from 'debug'
import * as mqtt from 'mqtt'
import { IClientOptions, IClientPublishOptions } from 'mqtt'
import pump from 'pump'
import { Writable } from 'readable-stream'
import split2 from 'split2'
import convertPayload from '../utils/convertPayload'
import delay from '../utils/delay'
import { fileDataSplitter, splitBatchFile, processPath, readFile } from '../utils/fileUtils'
import logWrapper, {
  basicLog,
  batchLog,
  benchLog,
  Signale,
  signale,
  simulateLog,
  singaleConfig,
} from '../utils/logWrapper'
import { handleLoadOptions, handleSaveOptions } from '../utils/options'
import {
  checkScenarioExists,
  checkTopicExists,
  parseConnectOptions,
  parsePublishOptions,
  validateClientCount,
  validateMaxInflight,
  validateBatchOptions,
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
  DEFAULT_BATCH_ITEMS,
  MAX_BATCH_ITEM_BYTES,
  DEFAULT_BATCH_LIMITS,
  PROTOCOL_BATCH_LIMITS,
} from '../utils/constants'
import shouldRetryConnectionError from '../utils/shouldRetryConnectionError'
import { addBatchOffer, createBatchSelectionCheck } from '../utils/batchOptions'
import { buildTopicCarrier, calculatePublishSize, encodeBatchPayload } from '../utils/batchPublishing'

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

interface PublishMessage {
  topic: string
  message: string | Buffer
  schemaOptions?: SchemaOptions
  format?: FormatType
  opts: IClientPublishOptions
}

interface BatchMessage extends PublishMessage {
  message: Buffer
}

const makeBatchPacket = (
  options: PublishOptions | BenchPublishOptions,
  payload: Buffer,
  count: number,
  opts: IClientPublishOptions,
): BatchMessage => {
  const batchOpts = { ...opts }
  if (options.mqttVersion === 5) {
    batchOpts.properties = {
      ...opts.properties,
      userProperties: { ...opts.properties?.userProperties, 'batch-format': 'v1', 'batch-size': String(count) },
    }
  }
  return {
    topic: options.mqttVersion === 4 ? buildTopicCarrier(count, options.topic) : options.topic,
    message: payload,
    opts: batchOpts,
  }
}

const checkBatchPacketSize = (packet: BatchMessage, version: number, maximum?: number) => {
  const bytes = calculatePublishSize({ ...packet.opts, topic: packet.topic, payload: packet.message }, version)
  if (maximum !== undefined && bytes > maximum) {
    throw new Error(`Batch packet too large: ${bytes} bytes exceeds broker Maximum Packet Size ${maximum}.`)
  }
}

// MQTT.js 4 replays outgoing packets before connect. Reject CONNACK before that replay.
const watchBatchConnection = (
  client: mqtt.MqttClient,
  options: PublishOptions | BenchPublishOptions,
  packets: BatchMessage[],
) => {
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

const buildBatchMessages = (options: PublishOptions, source: (string | Buffer)[]): BatchMessage[] => {
  const { opts } = parsePublishOptions(options)
  const limits = {
    maxItems: options.batchMaxItems ?? DEFAULT_BATCH_LIMITS.maxItems,
    maxBytes: options.batchMaxBytes ?? DEFAULT_BATCH_LIMITS.maxBytes,
  }
  const maxItemBytes = Math.min(MAX_BATCH_ITEM_BYTES, limits.maxBytes - 2)
  const packets: BatchMessage[] = []
  let items: Buffer[] = []
  let bytes = 0
  const flush = () => {
    if (items.length) {
      packets.push(makeBatchPacket(options, encodeBatchPayload(items, limits), items.length, opts))
    }
    items = []
    bytes = 0
  }
  source.forEach((item, index) => {
    const message = processPublishMessage(item, undefined, options.format)
    const buffer = Buffer.isBuffer(message) ? message : Buffer.from(message)
    if (buffer.length > maxItemBytes) {
      const limit =
        maxItemBytes < MAX_BATCH_ITEM_BYTES ? `--batch-max-bytes ${limits.maxBytes}` : 'the 2-byte item length prefix'
      logWrapper.fail(
        `Item ${index + 1} is ${buffer.length} B; a batch item can be at most ${maxItemBytes} B with ${limit}`,
      )
      process.exit(1)
    }
    if (items.length === limits.maxItems || bytes + buffer.length + 2 > limits.maxBytes) {
      flush()
    }
    items.push(buffer)
    bytes += buffer.length + 2
  })
  flush()
  packets.forEach((packet) => checkBatchPacketSize(packet, options.mqttVersion))
  return packets
}

const send = (
  config: boolean | string | undefined,
  connOpts: IClientOptions,
  messages: PublishMessage[],
  maximumReconnectTimes: number,
  onPublished: () => void = basicLog.published,
) => {
  let retryTimes = 0
  let publishComplete = false
  let started = false
  let pending = false
  let index = 0

  const client = createMqttClient(connOpts)
  basicLog.connecting(config, connOpts.hostname!, connOpts.port, messages[0].topic, messages[0].message.toString())

  client.on('connect', (packet) => {
    if (client.disconnecting) return
    retryTimes = 0
    basicLog.connected()
    basicLog.responseInformation(connOpts, packet)
    if (started) return
    started = true
    basicLog.publishing()
    const next = () => {
      if (client.disconnecting) return
      const pubOpts = messages[index]
      const { topic, message, schemaOptions, format } = pubOpts
      const publishMessage = processPublishMessage(message, schemaOptions, format)
      let settled = false
      pending = true
      client.publish(topic, publishMessage, pubOpts.opts, (err) => {
        // MQTT.js 4 calls back again when deleting a rejected outgoing packet.
        if (settled) return
        settled = true
        pending = false
        if (err) {
          return exitWithPublishError(client, err)
        }
        if (index + 1 < messages.length) {
          index += 1
          // QoS 0 callbacks can run synchronously; avoid growing the call stack.
          setImmediate(next)
          return
        }
        publishComplete = true
        onPublished()
        // FIXME: When using the ws and wss protocols to connect, and QoS is 0, the message may not have been successfully sent when the publish callback is triggered. Therefore, delay closing the connection for 2 seconds.
        if (['ws', 'wss'].includes(connOpts.protocol ?? '') && pubOpts.opts.qos === 0) {
          setTimeout(() => {
            client.end()
          }, 2000)
        } else {
          client.end()
        }
      })
    }
    next()
  })

  client.on('error', (err) => {
    exitWithPublishError(client, err)
  })

  client.on('close', () => {
    // MQTT.js cannot replay a QoS 0 callback waiting for the old stream to drain.
    if (!publishComplete && pending && messages[index].opts.qos === 0 && !client.disconnecting) {
      return exitWithPublishError(client, new Error('Connection closed before publishing completed'))
    }
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
    }
  })

  client.on('disconnect', (packet: IDisconnectPacket) => {
    basicLog.disconnect(packet)
  })
  return client
}

const multiSend = (
  config: boolean | string | undefined,
  connOpts: IClientOptions,
  pubOpts: PublishMessage,
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

  const messages = Array.isArray(options.message) ? options.message : [options.message]
  options.message = messages[messages.length - 1]

  saveOptions && handleSaveOptions('pub', options)

  debug && Debug.enable('mqttjs*')

  checkTopicExists(options.topic, 'pub')
  validateBatchOptions(options, 'pub')
  addBatchOffer(options)
  if (options.batch) {
    try {
      const source = options.fileRead
        ? splitBatchFile(handleFileRead(processPath(options.fileRead)), options.split || true)
        : messages
      const batches = buildBatchMessages(options, source)
      if (batches.length === 0) {
        logWrapper.success('No batch items to publish.')
        return
      }
      const itemCount = source.length
      watchBatchConnection(
        send(loadOptions, parseConnectOptions(options, 'pub'), batches, options.maximumReconnectTimes, () =>
          batchLog.published(itemCount, batches.length),
        ),
        options,
        batches,
      )
    } catch (error) {
      basicLog.error(error as Error)
      process.exit(1)
    }
    return
  }

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
          send(loadOptions, connOpts, [pubOpts], options.maximumReconnectTimes)
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
    send(loadOptions, connOpts, [pubOpts], options.maximumReconnectTimes)
  } else if (options.stdin) {
    handleStdin()
  } else if (options.payloadSize && options.message === DEFAULT_MQTT_PUB_MESSAGE) {
    const generatedPayload = handlePayloadSizeGeneration(options.payloadSize)
    if (generatedPayload) {
      pubOpts.message = generatedPayload
    }
    send(loadOptions, connOpts, [pubOpts], options.maximumReconnectTimes)
  } else {
    send(loadOptions, connOpts, [pubOpts], options.maximumReconnectTimes)
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
    validateBatchOptions(options, 'benchPub')
    addBatchOffer(options)
  }

  const connOpts = parseConnectOptions(options, 'pub')

  const pubOpts = parsePublishOptions(options)

  // Handle payload size generation for bench/simulate mode
  let generatedPayload: Buffer | null = null
  if (options.payloadSize && !fileRead && options.message === DEFAULT_MQTT_PUB_MESSAGE) {
    generatedPayload = handlePayloadSizeGeneration(options.payloadSize)
  }

  const batchItems = options.batch ? options.batchItems ?? DEFAULT_BATCH_ITEMS : undefined
  const publishLog = benchLog.publish(batchItems)
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

  const stats = { total: 0, failed: 0, sent: 0, limitReached: false, limit, fileRead }
  const reachedLimit = () => limit > 0 && stats.total + stats.failed >= limit
  const finishedSplit = () => splitLimit > 0 && stats.total + stats.failed >= splitLimit
  let readyAt: bigint | undefined

  process.once('SIGINT', () => {
    const elapsed = readyAt === undefined ? 0 : Number(process.hrtime.bigint() - readyAt) / 1e9
    logWrapper.log(`${publishLog.summary(stats)}, elapsed: ${elapsed.toFixed(2)}s`)
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

      let batchPacket: BatchMessage | undefined
      if (batchPayload) {
        try {
          batchPacket = makeBatchPacket({ ...options, topic: topicName }, batchPayload, batchItems!, pubOpts.opts)
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
            const sent = stats.total + stats.failed
            const limitReached = reachedLimit()
            // If the message or segmented file limit is reached, exit the process.
            if (limitReached || finishedSplit()) {
              stats.sent = sent
              stats.limitReached = limitReached
              exiting = true
              // Wait for the total number of sent messages to be printed, then exit the process.
              await delay(1000)
              const logMethod = stats.failed > 0 ? logWrapper.fail : logWrapper.success
              logMethod(publishLog.finish(stats))
              process.exit(stats.failed > 0 ? 1 : 0)
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
                stats.failed += 1
                basicLog.error(err)
              } else {
                stats.total += 1
              }
            }
            if (pubOpts.opts.qos === 0) {
              pendingQos0.add(onPublish)
            }
            const packet = batchPacket ?? { topic: publishTopic, message: publishMessage, opts: pubOpts.opts }
            client.publish(packet.topic, packet.message, packet.opts, onPublish)
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
            const rate = sampleRate(stats.total)
            const logMethod = verbose ? logWrapper.log : interactivePub.log
            logMethod(publishLog.rate(stats, rate))
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
