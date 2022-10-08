import * as mqtt from 'mqtt'
import * as fs from 'fs'
import signale from '../utils/signale'
import { parseConnectOptions } from '../utils/parse'

const conn = (options: ConnectOptions) => {
  const connectOptions = parseConnectOptions(options)

  const client = mqtt.connect(connectOptions)

  signale.await('Connecting...')

  client.on('connect', () => {
    signale.success('Connected')
  })

  client.on('error', (err) => {
    signale.error(err)
    client.end()
  })
}

export default conn
