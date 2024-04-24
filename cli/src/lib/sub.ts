import * as mqtt from 'mqtt'
import { Signale, signale, msgLog, basicLog, benchLog } from '../utils/signale'
import { parseConnectOptions, parseSubscribeOptions, checkTopicExists } from '../utils/parse'
import delay from '../utils/delay'
import convertPayload from '../utils/convertPayload'
import { saveConfig, loadConfig } from '../utils/config'
import { createNextNumberedFileName, writeFile, appendFile, processPath, getPathExtname } from '../utils/fileUtils'
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

const sub = (options: SubscribeOptions) => {
  const { debug, save, config } = options

  config && (options = loadConfig('sub', config))

  save && saveConfig('sub', options)

  debug && Debug.enable('mqttjs*')

  checkTopicExists(options.topic, 'sub')

  const connOpts = parseConnectOptions(options, 'sub')

  const client = mqtt.connect(connOpts)

  const { outputMode, maximumReconnectTimes } = options

  const outputModeClean = outputMode === 'clean'

  let retryTimes = 0

  !outputModeClean && basicLog.connecting(config, connOpts.hostname!, connOpts.port, options.topic.join(', '))

  client.on('connect', () => {
    const { fileWrite, fileSave } = options

    if(fileWrite && fileSave) {
      signale.error('Connected failed, Cannot use both fileSave and fileWrite options')
      process.exit(1)
    }

    !outputModeClean && basicLog.connected()

    retryTimes = 0

    const subOptsArray = parseSubscribeOptions(options)

    const { topic } = options

    topic.forEach((t: string, index: number) => {
      const subOpts = subOptsArray[index]

      !outputModeClean && basicLog.subscribing(t)

      client.subscribe(t, subOpts, (err, result) => {
        if (err) {
          !outputModeClean && basicLog.error(err)
          process.exit(1)
        } else {
          !outputModeClean && basicLog.subscribed(t)
        }

        result.forEach((sub) => {
          if (sub.qos > 2) {
            !outputModeClean && basicLog.subscriptionNegated(sub)
            process.exit(1)
          }
        })
      })
    })
  })

  client.on('message', (topic, payload, packet) => {
    const { format, protobufPath, protobufMessageName, fileSave, fileWrite } = options

    const msgData: Record<string, unknown>[] = []

    const fileOperate = {
      SAVE: fileSave && !fileWrite,
      WRITE: !fileSave && fileWrite,
      NONE: !fileSave && !fileWrite,
    } as const

    if(fileOperate.SAVE || fileOperate.WRITE) {
      let savePath = ''
      if(fileSave) {
        savePath = createNextNumberedFileName(processPath(fileSave))
      } else if(fileWrite) {
        savePath = processPath(fileWrite)
      }

      if(!savePath) {
        signale.error('A valid file path with extension is required when writing to a file')
        process.exit(1)
      }

      let messageFormat = format
      if ((!format || format !== 'binary') && isSupportedBinaryFormatForMQTT(getPathExtname(savePath))) {
        signale.warn('Please use the --format binary option for handling binary files')
        if(!format) {
          messageFormat = 'binary'
        }
      }

      const receivedMessage = processReceivedMessage(payload, protobufPath, protobufMessageName, messageFormat)

      fileOperate.SAVE && writeFile(savePath, receivedMessage)
      fileOperate.WRITE && appendFile(savePath, receivedMessage)

      const successMessage = fileOperate.SAVE ? 'Saved to file' : 'Appended to file'
      msgData.push({ label: 'payload', value: `${successMessage}: ${savePath}` })
    }

    options.verbose && msgData.push({ label: 'mqtt-packet', value: packet })

    msgData.push({ label: 'topic', value: topic })
    msgData.push({ label: 'qos', value: packet.qos })

    packet.retain && msgData.push({ label: 'retain', value: packet.retain })

    if(fileOperate.NONE) {
      const receivedMessage = processReceivedMessage(payload, protobufPath, protobufMessageName, format)
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
      !outputModeClean && basicLog.reconnecting()
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
  const { save, config } = options

  config && (options = loadConfig('benchSub', config))

  save && saveConfig('benchSub', options)

  const { count, interval, topic, hostname, port, clientId, verbose, maximumReconnectTimes } = options

  checkTopicExists(topic, 'benchSub')

  const connOpts = parseConnectOptions(options, 'sub')

  let connectedCount = 0

  const subOptsArray = parseSubscribeOptions(options)

  const isNewConnArray = Array(count).fill(true)

  const retryTimesArray = Array(count).fill(0)

  const interactive = new Signale({ interactive: true })
  const simpleInteractive = new Signale({
    interactive: true,
    config: { displayLabel: false, displayDate: true, displayTimestamp: true },
  })

  benchLog.start.sub(config, count, interval, hostname, port, topic.join(', '))

  const connStart = Date.now()

  let total = 0
  let oldTotal = 0

  for (let i = 1; i <= count; i++) {
    ;((i: number, connOpts: mqtt.IClientOptions) => {
      const opts = { ...connOpts }

      opts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

      const client = mqtt.connect(opts)

      interactive.await('[%d/%d] - Connecting...', connectedCount, count)

      client.on('connect', () => {
        connectedCount += 1
        retryTimesArray[i - 1] = 0
        if (isNewConnArray[i - 1]) {
          interactive.success('[%d/%d] - Connected', connectedCount, count)

          topic.forEach((t: string, index: number) => {
            const { username, clientId } = opts

            let topicName = t.replaceAll('%i', i.toString()).replaceAll('%c', clientId!)
            username && (topicName = topicName.replaceAll('%u', username))

            const subOpts = subOptsArray[index]

            interactive.await('[%d/%d] - Subscribing to %s...', connectedCount, count, topicName)

            client.subscribe(topicName, subOpts, (err, result) => {
              if (err) {
                signale.error(`[${i}/${count}] - Client ID: ${opts.clientId}, ${err}`)
                process.exit(1)
              } else {
                interactive.success('[%d/%d] - Subscribed to %s', connectedCount, count, topicName)
              }

              result.forEach((sub) => {
                if (sub.qos > 2) {
                  signale.error(
                    `[${i}/${count}] - Client ID: ${opts.clientId}, subscription negated to ${sub.topic} with code ${sub.qos}`,
                  )
                  process.exit(1)
                }
              })

              if (connectedCount === count && topic[topic.length - 1] === t) {
                const connEnd = Date.now()

                signale.info(`Created ${count} connections in ${(connEnd - connStart) / 1000}s`)

                total = 0

                if (!verbose) {
                  setInterval(() => {
                    const rate = total - oldTotal
                    simpleInteractive.info(`Received total: ${total}, rate: ${rate}/s`)
                    oldTotal = total
                  }, 1000)
                } else {
                  setInterval(() => {
                    if (total > oldTotal) {
                      const rate = total - oldTotal
                      signale.info(`Received total: ${total}, rate: ${rate}/s`)
                    }
                    oldTotal = total
                  }, 1000)
                }
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
