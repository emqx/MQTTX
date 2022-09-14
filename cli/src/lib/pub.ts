import * as mqtt from 'mqtt'
import * as fs from 'fs'
import pump from 'pump'
import concat from 'concat-stream'
import { Writable } from 'readable-stream'
import split2 from 'split2'
import { IClientPublishOptions } from 'mqtt'

const send = (options: any, pubOptions: IClientPublishOptions) => {
  const client = mqtt.connect(options)
  client.on('connect', () => {
    const { topic, message } = options
    client.publish(topic, message, pubOptions, (err) => {
      if (err) {
        console.warn(err)
      }
      client.end()
    })
  })
  client.on('error', (err) => {
    console.warn(err)
    client.end()
  })
}

const multisend = (options: any, pubOptions: IClientPublishOptions) => {
  const client = mqtt.connect(options)
  const sender = new Writable({
    objectMode: true,
  })
  sender._write = (line, _enc, cb) => {
    client.publish(options.topic, line.trim(), pubOptions, cb)
  }

  client.on('connect', () => {
    pump(process.stdin, split2(), sender, (err) => {
      client.end()
      if (err) {
        throw err
      }
    })
  })
}

const pub = (options: any) => {
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

  const pubOptions: IClientPublishOptions = {}

  if (typeof options.qos === 'number') {
    pubOptions.qos = options.qos
  }
  if (typeof options.retain === 'boolean') {
    pubOptions.retain = options.retain
  }
  if (options.protocolVersion === 5) {
    const { userProperties } = options
    userProperties && (pubOptions.properties = { userProperties })
  }

  if (options.stdin) {
    if (options.multiline) {
      multisend(options, pubOptions)
    } else {
      process.stdin.pipe(
        concat((data) => {
          options.message = data
          send(options, pubOptions)
        }),
      )
    }
  } else {
    send(options, pubOptions)
  }
}

export default pub
