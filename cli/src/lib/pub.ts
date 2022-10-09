import * as mqtt from 'mqtt'
import pump from 'pump'
import concat from 'concat-stream'
import { Writable } from 'readable-stream'
import split2 from 'split2'
import { IClientOptions, IClientPublishOptions } from 'mqtt'
import signale from '../utils/signale'
import { parseConnectOptions, parsePublishOptions } from '../utils/parse'

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
    pump(process.stdin, split2(), sender, (err) => {
      client.end()
      if (err) {
        throw err
      }
    })
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

export default pub
