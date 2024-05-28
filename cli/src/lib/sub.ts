import * as mqtt from 'mqtt'
import logWrapper, { Signale, msgLog, basicLog, benchLog, singaleConfig, signale } from '../utils/logWrapper'
import { parseConnectOptions, parseSubscribeOptions, checkTopicExists } from '../utils/parse'
import delay from '../utils/delay'
import convertPayload from '../utils/convertPayload'
import { handleSaveOptions, handleLoadOptions } from '../utils/options'
import { writeFile, appendFile, getPathExtname, createNextNumberedFileName } from '../utils/fileUtils'
import { deserializeBufferToProtobuf } from '../utils/protobuf'
import isSupportedBinaryFormatForMQTT from '../utils/binaryFormats'
import * as Debug from 'debug'

const processReceivedMessage = (
  payload: Buffer,
  protobufPath?: string,
  protobufMessageName?: string,
  format?: FormatType,
): string | Buffer => {
  let message: string | Buffer = payload
  /*
   * Pipeline for processing incoming messages, following two potential steps:
   * 1. Protobuf Deserialization --> Utilized if both protobuf path and message name are defined, otherwise message passes as is.
   * 2. Format Conversion --> Engaged if a format is defined, converting the message accordingly; if not defined, message passes unchanged.
   */
  const pipeline = [
    (msg: Buffer) =>
      protobufPath && protobufMessageName
        ? deserializeBufferToProtobuf(msg, protobufPath, protobufMessageName, format)
        : msg,
    (msg: Buffer) => (format ? convertPayload(msg, format, 'decode') : msg),
  ]

  message = pipeline.reduce((msg, transformer) => transformer(msg), message)

  if (Buffer.isBuffer(message) && format !== 'binary') {
    message = message.toString('utf-8')
  }

  return message
}

const handleDefaultBinaryFile = (format: FormatType | undefined, filePath?: string) => {
  if (filePath) {
    if ((!format || format !== 'binary') && isSupportedBinaryFormatForMQTT(getPathExtname(filePath))) {
      logWrapper.warn('Please use the --format binary option for handling binary files')
      if (!format) {
        return 'binary'
      }
    }
  }
  return format
}

const sub = (options: SubscribeOptions) => {
  const { loadOptions, saveOptions } = options

  loadOptions && (options = handleLoadOptions('sub', loadOptions))

  saveOptions && handleSaveOptions('sub', options)

  options.format = handleDefaultBinaryFile(options.format, options.fileSave || options.fileWrite)

  options.debug && Debug.enable('mqttjs*')

  checkTopicExists(options.topic, 'sub')

  const connOpts = parseConnectOptions(options, 'sub')

  const client = mqtt.connect(connOpts)

  const { outputMode, maximumReconnectTimes } = options

  const outputModeClean = outputMode === 'clean'

  let retryTimes = 0

  !outputModeClean && basicLog.connecting(loadOptions, connOpts.hostname!, connOpts.port, options.topic.join(', '))

  const subscribeToTopics = async () => {
    if (!outputModeClean) basicLog.connected()

    retryTimes = 0

    const subOptsArray = parseSubscribeOptions(options)
    const { topic } = options

    if (!outputModeClean) {
      topic.forEach((t: string) => basicLog.subscribing(t))
    }

    const subscribePromises = topic.map((t: string, index: number) => {
      const subOpts = subOptsArray[index]
      return new Promise<{ successfulSubs: mqtt.ISubscriptionGrant[]; failedSubs: mqtt.ISubscriptionGrant[] }>(
        (resolve, reject) => {
          client.subscribe(t, subOpts, (err, result) => {
            if (err) {
              if (!outputModeClean) basicLog.error(err)
              return reject(err)
            }

            const successfulSubs: mqtt.ISubscriptionGrant[] = []
            const failedSubs: mqtt.ISubscriptionGrant[] = []

            result.forEach((sub) => {
              if (sub.qos > 2) {
                failedSubs.push(sub)
                if (!outputModeClean) basicLog.subscriptionNegated(sub)
              } else {
                successfulSubs.push(sub)
                if (!outputModeClean) basicLog.subscribed(sub.topic)
              }
            })

            resolve({ successfulSubs, failedSubs })
          })
        },
      )
    })

    try {
      const results = await Promise.all(subscribePromises)
      const allSuccessfulSubs = results.flatMap((r) => r.successfulSubs)

      if (allSuccessfulSubs.length === 0) {
        process.exit(1)
      }
    } catch (error) {
      process.exit(1)
    }
  }

  client.on('connect', subscribeToTopics)

  client.on('message', (topic, payload, packet) => {
    const { format, protobufPath, protobufMessageName, fileSave, fileWrite, delimiter } = options

    const msgData: Record<string, unknown>[] = []

    const receivedMessage = processReceivedMessage(payload, protobufPath, protobufMessageName, format)

    const savePath = fileSave ? createNextNumberedFileName(fileSave) : fileWrite
    if (savePath) {
      fileSave && writeFile(savePath, receivedMessage)
      fileWrite && appendFile(savePath, receivedMessage, delimiter)
    }

    options.verbose && msgData.push({ label: 'mqtt-packet', value: packet })

    msgData.push({ label: 'topic', value: topic })
    msgData.push({ label: 'qos', value: packet.qos })

    packet.retain && msgData.push({ label: 'retain', value: packet.retain })

    if (savePath) {
      const successMessage = fileSave ? 'Saved to file' : 'Appended to file'
      msgData.push({ label: 'payload', value: `${successMessage}: ${savePath}` })
    } else {
      msgData.push({ label: 'payload', value: receivedMessage })
    }

    if (packet.properties?.userProperties) {
      const up: { key: string; value: string }[] = []
      Object.entries(packet.properties.userProperties).forEach(([key, value]) => {
        if (typeof value === 'string') {
          up.push({ key, value })
        } else {
          value.forEach((v) => {
            up.push({ key, value: v })
          })
        }
      })
      msgData.push({ label: 'userProperties', value: up })
    }

    !outputModeClean
      ? msgLog(msgData)
      : console.log(JSON.stringify({ topic, payload: convertPayload(payload, format, 'decode'), packet }, null, 2))
  })

  client.on('error', (err) => {
    !outputModeClean && basicLog.error(err)
    client.end()
  })

  client.on('reconnect', () => {
    retryTimes += 1
    if (retryTimes > maximumReconnectTimes) {
      client.end(false, {}, () => {
        !outputModeClean && basicLog.reconnectTimesLimit()
      })
    } else {
      !outputModeClean && basicLog.reconnecting(retryTimes, maximumReconnectTimes)
    }
  })

  client.on('close', () => {
    !outputModeClean && basicLog.close()
  })

  client.on('disconnect', (packet: IDisconnectPacket) => {
    !outputModeClean && basicLog.disconnect(packet)
  })
}

const benchSub = async (options: BenchSubscribeOptions) => {
  const { saveOptions, loadOptions } = options

  loadOptions && (options = handleLoadOptions('benchSub', loadOptions))

  saveOptions && handleSaveOptions('benchSub', options)

  const { count, interval, topic, hostname, port, clientId, verbose, maximumReconnectTimes } = options

  checkTopicExists(topic, 'benchSub')

  const connOpts = parseConnectOptions(options, 'sub')

  let connectedCount = 0

  const subOptsArray = parseSubscribeOptions(options)

  const isNewConnArray = Array(count).fill(true)

  const retryTimesArray = Array(count).fill(0)

  const interactiveSub = new Signale({ interactive: true, config: singaleConfig })

  benchLog.start.sub(loadOptions, count, interval, hostname, port, topic.join(', '))

  const connStart = Date.now()

  let total = 0
  let oldTotal = 0

  let isLogged = false
  let subscribedCount = 0

  for (let i = 1; i <= count; i++) {
    ;((i: number, connOpts: mqtt.IClientOptions) => {
      const opts = { ...connOpts }

      opts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

      const client = mqtt.connect(opts)

      interactiveSub.await('[%d/%d] - Connecting...', connectedCount, count)

      client.on('connect', () => {
        connectedCount += 1
        retryTimesArray[i - 1] = 0
        if (isNewConnArray[i - 1]) {
          interactiveSub.success('[%d/%d] - Connected', connectedCount, count)

          topic.forEach((t: string, index: number) => {
            const { username, clientId } = opts

            let topicName = t.replaceAll('%i', i.toString()).replaceAll('%c', clientId!)
            username && (topicName = topicName.replaceAll('%u', username))

            const subOpts = subOptsArray[index]

            interactiveSub.await('[%d/%d] - Subscribing to %s...', connectedCount, count, topicName)

            client.subscribe(topicName, subOpts, (err, result) => {
              if (err) {
                logWrapper.fail(`[${i}/${count}] - Client ID: ${opts.clientId}, ${err}`)
                process.exit(1)
              }

              result.forEach((sub) => {
                if (sub.qos > 2) {
                  logWrapper.fail(
                    `[${i}/${count}] - Client ID: ${opts.clientId}, subscription negated to ${sub.topic} with code ${sub.qos}`,
                  )
                  process.exit(1)
                }
              })

              interactiveSub.success('[%d/%d] - Subscribed to %s', connectedCount, count, topicName)
              subscribedCount += 1

              if (connectedCount === count && subscribedCount === count * topic.length && !isLogged) {
                const connEnd = Date.now()
                signale.success(`Created ${count} connections in ${(connEnd - connStart) / 1000}s`)
                total = 0
                isLogged = true

                const intervalFunc = () => {
                  const rate = total - oldTotal
                  interactiveSub.log(`Received total: ${total}, rate: ${rate}/s`)
                  oldTotal = total
                }

                const verboseIntervalFunc = () => {
                  if (total > oldTotal) {
                    const rate = total - oldTotal
                    logWrapper.log(`Received total: ${total}, rate: ${rate}/s`)
                  }
                  oldTotal = total
                }

                setInterval(verbose ? verboseIntervalFunc : intervalFunc, 1000)
              }
            })
          })
        } else {
          benchLog.reconnected(connectedCount, count, opts.clientId!)
        }
      })

      client.on('message', () => {
        total += 1
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

export default sub

export { sub, benchSub }
