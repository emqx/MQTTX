import * as mqtt from 'mqtt'
import * as fs from 'fs'

const conn = (options: any) => {
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
    console.log('connected')
  })

  client.on('error', (err) => {
    console.warn(err)
    client.end()
  })
}

export default conn
