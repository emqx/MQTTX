import * as mqtt from 'mqtt'
import pump from 'pump'
import concat from 'concat-stream'
import { Writable } from 'readable-stream'
import split2 from 'split2'
import { IClientOptions, IClientPublishOptions } from 'mqtt'
import { Signale, signale } from '../utils/signale'
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
) => {
  let isNewConnection = true
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
    signale.await('Reconnecting...')
    isNewConnection = false
    sender.uncork()
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
      multisend(connOpts, pubOpts)
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
  const { count, interval, messageInterval, clientId, verbose } = options

  const connOpts = parseConnectOptions(options, 'pub')

  const pubOpts = parsePublishOptions(options)

  const { username } = connOpts

  const { topic, message } = pubOpts

  const isNewConnArray = Array(count).fill(true)

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

      interactive.await('[%d/%d] - Connecting...', i, count)

      client.on('connect', () => {
        if (isNewConnArray[i - 1]) {
          interactive.success('[%d/%d] - Connected', i, count)

          setInterval(() => {
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
          signale.success(`[${i}/${count}] - Client ID: ${opts.clientId}, Reconnected`)
        }
      })

      client.on('error', (err) => {
        signale.error(`[${i}/${count}] - Client ID: ${opts.clientId}, ${err}`)
        client.end()
      })

      client.on('reconnect', () => {
        signale.await(`[${i}/${count}] - Client ID: ${opts.clientId}, Reconnecting...`)
        isNewConnArray[i - 1] = false
      })

      client.on('close', () => {
        signale.error(`[${i}/${count}] - Client ID: ${opts.clientId}, Connection closed`)
      })
    })(i, connOpts)

    await delay(interval)
  }
}

export default pub

export { pub, benchPub }
