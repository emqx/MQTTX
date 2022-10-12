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
    if (options.verbose) {
      msgData.push({ label: 'topic', value: topic })
    }
    if (packet.properties && packet.properties.userProperties) {
      msgData.push({ label: 'user properties', value: { ...packet.properties.userProperties } })
    }
    msgData.push({ label: 'payload', value: payload.toString() })
    msgLog(msgData)
  })

  client.on('error', (err) => {
    signale.error(err)
    client.end()
  })
}

const benchSub = async (options: BenchSubscribeOptions) => {
  const { count, interval, topic, clientId } = options

  const connOpts = parseConnectOptions(options, 'sub')

  const subOptsArray = parseSubscribeOptions(options)

  const interactive = new Signale({ interactive: true })

  signale.info(
    `Start the subscribe benchmarking, connections: ${count}, req interval: ${interval}ms, topic: ${topic.join(',')}`,
  )

  const connStart = Date.now()

  let total = 0
  let oldTotal = 0

  for (let i = 1; i <= count; i++) {
    connOpts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

    const client = mqtt.connect(connOpts)

    interactive.await('[%d/%d] - Connecting...', i, count)

    client.on('connect', () => {
      interactive.success('[%d/%d] - Connected', i, count)

      topic.forEach((t: string, index: number) => {
        const { username, clientId } = connOpts

        let topicName = t.replaceAll('%i', i.toString()).replaceAll('%c', clientId!)
        username && (topicName = topicName.replaceAll('%u', username))

        const subOpts = subOptsArray[index]

        interactive.await('[%d/%d] - Subscribing to %s...', i, count, topicName)

        client.subscribe(topicName, subOpts, (err, result) => {
          if (err) {
            signale.error(`[${i}/${count}] - ${err}`)
            process.exit(1)
          } else {
            interactive.success('[%d/%d] - Subscribed to %s', i, count, topicName)
          }

          result.forEach((sub) => {
            if (sub.qos > 2) {
              signale.error(`[${i}/${count}] - subscription negated to ${sub.topic} with code ${sub.qos}`)
              process.exit(1)
            }
          })
        })
      })
    })

    client.on('message', () => {
      total += 1
    })

    client.on('error', (err) => {
      signale.error(`[${i}/${count}] - ${err}`)
      client.end()
    })

    await delay(interval)
  }

  const connEnd = Date.now()

  signale.info(`Created ${count} connections in ${(connEnd - connStart) / 1000}s`)

  total = 0

  setInterval(() => {
    if (total > oldTotal) {
      const rate = total - oldTotal
      signale.info(`Received total: ${total}, rate: ${rate}/s`)
    }
    oldTotal = total
  }, 1000)
}

export default sub

export { sub, benchSub }
