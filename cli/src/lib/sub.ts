import * as mqtt from 'mqtt'
import { Signale, signale, msgLog } from '../utils/signale'
import { parseConnectOptions, parseSubscribeOptions } from '../utils/parse'
import delay from '../utils/delay'

const sub = (options: SubscribeOptions) => {
  const connOpts = parseConnectOptions(options, 'sub')

  const client = mqtt.connect(connOpts)

  signale.await('Connecting...')

  client.on('connect', () => {
    signale.success('Connected')

    const subOptsArray = parseSubscribeOptions(options)

    const { topic } = options

    topic.forEach((t: string, index: number) => {
      const subOpts = subOptsArray[index]

      signale.await(`Subscribing to ${t}...`)

      client.subscribe(t, subOpts, (err, result) => {
        if (err) {
          signale.error(err)
          process.exit(1)
        } else {
          signale.success(`Subscribed to ${t}`)
        }

        result.forEach((sub) => {
          if (sub.qos > 2) {
            signale.error('subscription negated to', sub.topic, 'with code', sub.qos)
            process.exit(1)
          }
        })
      })
    })
  })

  client.on('message', (topic, payload, packet) => {
    const msgData: Record<string, unknown>[] = []

    options.verbose && msgData.push({ label: 'topic', value: topic })

    msgData.push({ label: 'payload', value: payload.toString() })

    packet.retain && msgData.push({ label: 'retain', value: packet.retain })

    packet.properties?.userProperties &&
      msgData.push({ label: 'user properties', value: { ...packet.properties.userProperties } })

    msgLog(msgData)
  })

  client.on('error', (err) => {
    signale.error(err)
    client.end()
  })

  client.on('reconnect', () => {
    signale.await('Reconnecting...')
  })

  client.on('close', () => {
    signale.error('Connection closed')
  })
}

const benchSub = async (options: BenchSubscribeOptions) => {
  const { count, interval, topic, clientId, verbose } = options

  const connOpts = parseConnectOptions(options, 'sub')

  let connectedCount = 0

  const subOptsArray = parseSubscribeOptions(options)

  const isNewConnArray = Array(count).fill(true)

  const interactive = new Signale({ interactive: true })
  const simpleInteractive = new Signale({ interactive: true, config: { displayLabel: false, displayTimestamp: true } })

  signale.info(
    `Start the subscribe benchmarking, connections: ${count}, req interval: ${interval}ms, topic: ${topic.join(',')}`,
  )

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

              if (i === count) {
                const connEnd = Date.now()

                signale.info(`Created ${count} connections in ${(connEnd - connStart) / 1000}s`)

                total = 0

                if (!verbose) {
                  setInterval(() => {
                    if (total > oldTotal) {
                      const rate = total - oldTotal
                      simpleInteractive.info(`Received total: ${total}, rate: ${rate}/s`)
                    }
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
          signale.success(`[${connectedCount}/${count}] - Client ID: ${opts.clientId}, Reconnected`)
        }
      })

      client.on('message', () => {
        total += 1
      })

      client.on('error', (err) => {
        signale.error(`[${connectedCount}/${count}] - Client ID: ${opts.clientId}, ${err}`)
        client.end()
      })

      client.on('reconnect', () => {
        signale.await(`[${connectedCount}/${count}] - Client ID: ${opts.clientId}, Reconnecting...`)
        isNewConnArray[i - 1] = false
      })

      client.on('close', () => {
        connectedCount -= 1
        signale.error(`[${connectedCount}/${count}] - Client ID: ${opts.clientId}, Connection closed`)
      })
    })(i, connOpts)

    await delay(interval)
  }
}

export default sub

export { sub, benchSub }
