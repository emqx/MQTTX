import * as mqtt from 'mqtt'
import { signale, msgLog } from '../utils/signale'
import { parseConnectOptions, parseSubscribeOptions } from '../utils/parse'

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

export default sub
