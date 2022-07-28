import * as mqtt from 'mqtt'
import * as fs from 'fs'
import { IClientSubscribeOptions } from 'mqtt'

const sub = (options: any) => {
  options.protocolVersion = options.mqttVersion
  if (options.protocolVersion === 5) {
    if (options.userProperties) {
      options.properties = { userProperties: options.userProperties }
    }
  } else if (options.protocolVersion === 3) {
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

  client.on('connect', () => {
    const { topic, qos, no_local, retainAsPublished, retainHandling } = options
    const subOptions: {
      qos: number
      nl?: boolean
      rap?: boolean
      rh?: number
    } = {
      qos,
    }
    if (options.protocolVersion === 5) {
      subOptions.nl = no_local
      subOptions.rap = retainAsPublished
      subOptions.rh = retainHandling
    }
    client.subscribe(topic, subOptions as IClientSubscribeOptions, (err, result) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      result.forEach((sub) => {
        if (sub.qos > 2) {
          console.error('subscription negated to', sub.topic, 'with code', sub.qos)
          process.exit(1)
        }
      })
    })
  })

  client.on('message', (topic, payload, packet) => {
    if (options.verbose) {
      console.log('topic: ', topic)
    }
    if (packet.properties && packet.properties.userProperties) {
      console.log('user properties: ', { ...packet.properties.userProperties })
    }
    console.log('payload: ', payload.toString())
  })

  client.on('error', (err) => {
    console.warn(err)
    client.end()
  })
}

export default sub
