import * as mqtt from 'mqtt'
import * as fs from 'fs'
import { IClientSubscribeOptions } from 'mqtt'
import { getSpecialTypesOption } from '../utils/generator'
import { signale, msgLog } from '../utils/signale'

const sub = (options: any) => {
  options.protocolVersion = options.mqttVersion
  if (options.protocolVersion === 3) {
    options.protocolId = 'MQIsdp'
  }

  if (options.key) {
    options.key = fs.readFileSync(options.key)
  }

  if (options.cert) {
    options.cert = fs.readFileSync(options.cert)
  }

  if (options.ca) {
    options.ca = fs.readFileSync(options.ca)
  }

  if (options.key && options.cert && !options.protocol) {
    options.protocol = 'mqtts'
  }

  if (options.insecure) {
    options.rejectUnauthorized = false
  }

  if (options.willTopic) {
    options.will = {}
    options.will.topic = options.willTopic
    options.will.payload = options.willMessage
    options.will.qos = options.willQos
    options.will.retain = options.willRetain
  }

  options.keepAlive = options.keepalive

  const client = mqtt.connect(options)

  signale.await('Connecting...')

  client.on('connect', () => {
    signale.success('Connected')

    const { topic, qos, no_local, retainAsPublished, retainHandling, userProperties } = options

    topic.forEach((t: string, index: number) => {
      const subOptions: IClientSubscribeOptions = {
        qos: getSpecialTypesOption(qos, index, 0) as IClientSubscribeOptions['qos'],
      }
      if (options.protocolVersion === 5) {
        subOptions.nl = getSpecialTypesOption(no_local as boolean[], index)
        subOptions.rap = getSpecialTypesOption(retainAsPublished as boolean[], index)
        subOptions.rh = getSpecialTypesOption(retainHandling as number[], index)
        userProperties && (subOptions.properties = { userProperties })
      }

      signale.await(`Subscribing to ${t}...`)

      client.subscribe(t, subOptions, (err, result) => {
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
