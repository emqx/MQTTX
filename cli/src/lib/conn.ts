import * as mqtt from 'mqtt'
import signale from '../utils/signale'
import { parseConnectOptions } from '../utils/parse'

const conn = (options: ConnectOptions) => {
  const connOpts = parseConnectOptions(options, 'conn')

  const client = mqtt.connect(connOpts)

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
