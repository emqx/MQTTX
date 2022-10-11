import * as mqtt from 'mqtt'
import { Signale, signale } from '../utils/signale'
import { parseConnectOptions } from '../utils/parse'
import { getClientId } from '../utils/generator'

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

const benchConn = async (options: BenchConnectOptions) => {
  const { count, interval } = options

  const connOpts = parseConnectOptions(options, 'conn')

  const interactive = new Signale({ interactive: true })

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  signale.info(`Start the connect benchmarking, connections: ${count}, req interval: ${interval}ms`)

  const start = Date.now()

  for (let i = 1; i <= count; i++) {
    connOpts.clientId = `${getClientId()}_${i}`

    const client = mqtt.connect(connOpts)

    interactive.await('[%d/%d] - Connecting...', i, count)

    client.on('connect', () => {
      interactive.success('[%d/%d] - Connected', i, count)
    })

    client.on('error', (err) => {
      signale.error(`[${i}/${count}] - ${err}`)
      client.end()
    })

    await delay(interval)
  }

  const end = Date.now()

  signale.info(`Done, total time: ${(end - start) / 1000}s`)
}

export default conn

export { conn, benchConn }
