import * as mqtt from 'mqtt'
import { Signale, signale } from '../utils/signale'
import { parseConnectOptions } from '../utils/parse'
import delay from '../utils/delay'

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

  client.on('reconnect', () => {
    signale.await('Reconnecting...')
  })

  client.on('close', () => {
    signale.error('Connection closed')
  })
}

const benchConn = async (options: BenchConnectOptions) => {
  const { count, interval, clientId } = options

  const connOpts = parseConnectOptions(options, 'conn')

  const interactive = new Signale({ interactive: true })

  signale.info(`Start the connect benchmarking, connections: ${count}, req interval: ${interval}ms`)

  const start = Date.now()

  for (let i = 1; i <= count; i++) {
    connOpts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

    const client = mqtt.connect(connOpts)

    interactive.await('[%d/%d] - Connecting...', i, count)

    client.on('connect', () => {
      interactive.success('[%d/%d] - Connected', i, count)

      if (i === count) {
        const end = Date.now()
        signale.info(`Done, total time: ${(end - start) / 1000}s`)
      }
    })

    client.on('error', (err) => {
      signale.error(`[${i}/${count}] - Client ID: ${connOpts.clientId}, ${err}`)
      client.end()
    })

    await delay(interval)
  }
}

export default conn

export { conn, benchConn }
