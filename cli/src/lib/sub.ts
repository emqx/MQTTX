import * as mqtt from 'mqtt'
import logWrapper, { Signale, msgLog, basicLog, benchLog, singaleConfig, signale } from '../utils/logWrapper'
import { parseConnectOptions, parseSubscribeOptions, parseSchemaOptions, checkTopicExists } from '../utils/parse'
import delay from '../utils/delay'
import convertPayload from '../utils/convertPayload'
import { handleSaveOptions, handleLoadOptions } from '../utils/options'
import { writeFile, appendFile, getPathExtname, createNextNumberedFileName } from '../utils/fileUtils'
import { deserializeBufferToProtobuf } from '../utils/protobuf'
import isSupportedBinaryFormatForMQTT from '../utils/binaryFormats'
import * as Debug from 'debug'
import { deserializeBufferToAvro } from '../utils/avro'

/**
 *
 * Pipeline for processing incoming messages, following two potential steps:
 * 1. Protobuf Deserialization --> Utilized if both protobuf path and message name are defined, otherwise message passes as is.
 * 2. Format Conversion --> Engaged if a format is defined, converting the message accordingly; if not defined, message passes unchanged.
 * Flow:
 *  payload -> Schema [Protobuf, Avro] -> [Format Conversion] -> Processed Message
 * @param payload - The message payload to be processed.
 * @param {SchemaOptions} [schemaOptions] - Options for schema-based encoding
 * @param format - The format of the payload.
 * @returns The processed message as a string or Buffer.
 */
const processReceivedMessage = (
  payload: Buffer,
  schemaOptions?: SchemaOptions,
  format?: FormatType,
): string | Buffer => {
  let message: string | Buffer = payload

  const convertMessageFormat = (msg: string | Buffer): string | Buffer => {
    if (!format) {
      return msg
    }
    return convertPayload(msg, format, 'decode')
  }

  const deserializeWithSchema = (msg: string | Buffer): string | Buffer => {
    if (!schemaOptions) return msg

    switch (schemaOptions.type) {
      case 'protobuf':
        return deserializeBufferToProtobuf(
          payload,
          schemaOptions.protobufPath,
          schemaOptions.protobufMessageName,
          format,
        )

      case 'avro':
        return deserializeBufferToAvro(payload, schemaOptions.avscPath, format ? true : false)
    }
  }

  const pipeline = [deserializeWithSchema, convertMessageFormat]

  message = pipeline.reduce((msg: string | Buffer, transformer) => transformer(msg), message)

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
    const { format, protobufPath, protobufMessageName, avscPath, fileSave, fileWrite, delimiter } = options

    const schemaOptions: SchemaOptions | undefined = parseSchemaOptions(protobufPath, protobufMessageName, avscPath)

    const msgData: MsgItem[] = []

    const receivedMessage = processReceivedMessage(payload, schemaOptions, format)

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
      msgData.push({ label: 'payload', value: `${receivedMessage}\n${successMessage}: ${savePath}` })
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

  const subOptsArray = parseSubscribeOptions(options)

  const isNewConnArray = Array(count).fill(true)

  const retryTimesArray = Array(count).fill(0)

  const interactiveSub = new Signale({ interactive: true, config: singaleConfig })

  benchLog.start.sub(loadOptions, count, interval, hostname, port, topic.join(', '))

  const connStart = Date.now()

  let total = 0
  let oldTotal = 0
  let isLogged = false
  let connectedCount = 0
  let subscribedCount = 0
  const allSuccessfulSubs: mqtt.ISubscriptionGrant[] = []
  const failedSubs: { clientId: string; subItem: mqtt.ISubscriptionGrant }[] = []

  for (let i = 1; i <= count; i++) {
    ;((i: number, connOpts: mqtt.IClientOptions) => {
      const opts = { ...connOpts }

      opts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

      const client = mqtt.connect(opts)

      interactiveSub.await('[%d/%d] - Connecting...', connectedCount, count)

      client.on('connect', async () => {
        connectedCount += 1
        retryTimesArray[i - 1] = 0
        if (isNewConnArray[i - 1]) {
          interactiveSub.success('[%d/%d] - Connected', connectedCount, count)

          if (count === connectedCount) {
            const connEnd = Date.now()
            signale.success(`Created ${count} connections in ${(connEnd - connStart) / 1000}s`)
          }

          const subscribePromises = topic.map((t: string, index: number) => {
            return new Promise<void>((resolve, reject) => {
              const { username, clientId } = opts
              let topicName = t.replaceAll('%i', i.toString()).replaceAll('%c', clientId!)
              username && (topicName = topicName.replaceAll('%u', username))
              const subOpts = subOptsArray[index]
              client.subscribe(topicName, subOpts, (err, result) => {
                if (err) {
                  logWrapper.fail(`[${i}/${count}] - Client ID: ${opts.clientId}, ${err}`)
                  return reject(err)
                }
                result.forEach((sub) => {
                  if (sub.qos > 2) {
                    failedSubs.push({
                      clientId: opts.clientId!,
                      subItem: sub,
                    })
                  } else {
                    allSuccessfulSubs.push(sub)
                  }
                  subscribedCount += 1
                })
                resolve()
              })
            })
          })

          try {
            await Promise.all(subscribePromises)

            if (connectedCount === count && subscribedCount === count * topic.length && !isLogged) {
              if (allSuccessfulSubs.length > 0) {
                logWrapper.success(`All connections subscribed`)
              }

              if (failedSubs.length > 0) {
                failedSubs.forEach((sub) => {
                  basicLog.subscriptionNegated(sub.subItem, sub.clientId)
                })
              }

              if (allSuccessfulSubs.length === 0) {
                process.exit(1)
              }

              total = 0
              isLogged = true

              const logRate = () => {
                const rate = total - oldTotal
                const logMethod = verbose ? logWrapper.log : interactiveSub.log
                logMethod(`Received total: ${total}, rate: ${rate}/s`)
                oldTotal = total
              }

              setInterval(logRate, 1000)
            }
          } catch (error) {
            process.exit(1)
          }
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
