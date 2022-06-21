import * as mqtt from 'mqtt'
import * as fs from 'fs'

const sub = (options: any) => {
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
    client.subscribe(options.topic, { qos: options.qos }, (err, result) => {
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

  client.on('message', (topic, payload) => {
    if (options.verbose) {
      console.log(topic, payload.toString())
    } else {
      console.log(payload.toString())
    }
  })

  client.on('error', (err) => {
    console.warn(err)
    client.end()
  })
}

module.exports = sub
