import * as mqtt from 'mqtt'
import pump from 'pump'
import concat from 'concat-stream'
import { Writable } from 'readable-stream'
import split2 from 'split2'
import { IClientOptions, IClientPublishOptions } from 'mqtt'
import { Signale, signale, benchLog } from '../utils/signale'
import { parseConnectOptions, parsePublishOptions } from '../utils/parse'
import delay from '../utils/delay'

const send = (
  connOpts: IClientOptions,
  pubOpts: { topic: string; message: string | Buffer; opts: IClientPublishOptions },
) => {
  const client = mqtt.connect(connOpts)
  signale.await('Connecting...')
  client.on('connect', () => {
    signale.success('Connected')
    const { topic, message } = pubOpts
    signale.await('Message Publishing...')
    client.publish(topic, message, pubOpts.opts, (err) => {
      if (err) {
        signale.warn(err)
      } else {
        signale.success('Message published')
      }
      client.end()
    })
  })
  client.on('error', (err) => {
    signale.error(err)
    client.end()
  })
}

const multisend = (
  connOpts: IClientOptions,
  pubOpts: { topic: string; message: string | Buffer; opts: IClientPublishOptions },
  maximunReconnectTimes: number,
) => {
  let isNewConnection = true
  let retryTimes = 0
  const client = mqtt.connect(connOpts)
  signale.await('Connecting...')
  const sender = new Writable({
    objectMode: true,
  })
  sender._write = (line, _enc, cb) => {
    const { topic, opts } = pubOpts
    client.publish(topic, line.trim(), opts, cb)
  }

  client.on('connect', () => {
    signale.success('Connected, press Enter to publish, press Ctrl+C to exit')
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
    signale.error(err)
    client.end()
  })

  client.on('reconnect', () => {
    retryTimes += 1
    if (retryTimes > maximunReconnectTimes) {
      client.end(false, {}, () => {
        signale.error('Exceed the maximum reconnect times limit, stop retry')
        process.exit(1)
      })
    } else {
      signale.await('Reconnecting...')
      isNewConnection = false
      sender.uncork()
    }
  })

  client.on('close', () => {
    signale.error('Connection closed')
    const { reconnectPeriod } = connOpts
    reconnectPeriod ? sender.cork() : process.exit(1)
  })
}

const pub = (options: PublishOptions) => {
  const connOpts = parseConnectOptions(options, 'pub')

  const pubOpts = parsePublishOptions(options)

  if (options.stdin) {
    if (options.multiline) {
      multisend(connOpts, pubOpts, options.maximunReconnectTimes)
    } else {
      process.stdin.pipe(
        concat((data) => {
          pubOpts.message = data
          send(connOpts, pubOpts)
        }),
      )
    }
  } else {
    send(connOpts, pubOpts)
  }
}

const benchPub = async (options: BenchPublishOptions) => {
  const { count, interval, messageInterval, clientId, verbose, maximunReconnectTimes } = options

  const connOpts = parseConnectOptions(options, 'pub')

  const pubOpts = parsePublishOptions(options)

  const { username } = connOpts

  const { topic, message } = pubOpts

  let connectedCount = 0

  const isNewConnArray = Array(count).fill(true)

  const retryTimesArray = Array(count).fill(0)

  const interactive = new Signale({ interactive: true })
  const simpleInteractive = new Signale({ interactive: true, config: { displayLabel: false, displayTimestamp: true } })

  signale.info(
    `Start the publish benchmarking, connections: ${count}, req interval: ${interval}ms, message interval: ${messageInterval}ms`,
  )

  const connStart = Date.now()

  let total = 0
  let rate = 0

  for (let i = 1; i <= count; i++) {
    ;((i: number, connOpts: mqtt.IClientOptions) => {
      const opts = { ...connOpts }

      opts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

      let topicName = topic.replaceAll('%i', i.toString()).replaceAll('%c', clientId)
      username && (topicName = topicName.replaceAll('%u', username))

      const client = mqtt.connect(opts)

      interactive.await('[%d/%d] - Connecting...', connectedCount, count)

      client.on('connect', () => {
        connectedCount += 1
        retryTimesArray[i - 1] = 0
        if (isNewConnArray[i - 1]) {
          interactive.success('[%d/%d] - Connected', connectedCount, count)

          setInterval(() => {
            client.connected &&
              client.publish(topicName, message, pubOpts.opts, (err) => {
                if (err) {
                  signale.warn(err)
                } else {
                  total += 1
                  rate += 1
                }
              })
          }, messageInterval)

          if (i === count) {
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
        if (retryTimesArray[i - 1] > maximunReconnectTimes) {
          client.end(false, {}, () => {
            benchLog.reconnectTimesLimit(connectedCount, count, opts.clientId!)
            if (retryTimesArray.findIndex((times) => times <= maximunReconnectTimes) === -1) {
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

export default pub

export { pub, benchPub }
