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

  let connectedCount = 0

  const isNewConnArray = Array(count).fill(true)

  const interactive = new Signale({ interactive: true })

  signale.info(`Start the connect benchmarking, connections: ${count}, req interval: ${interval}ms`)

  const start = Date.now()

  for (let i = 1; i <= count; i++) {
    ;((i: number, connOpts: mqtt.IClientOptions) => {
      const opts = { ...connOpts }

      opts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

      const client = mqtt.connect(opts)

      interactive.await('[%d/%d] - Connecting...', connectedCount, count)

      client.on('connect', () => {
        connectedCount += 1
        if (isNewConnArray[i - 1]) {
          interactive.success('[%d/%d] - Connected', connectedCount, count)

          if (i === count) {
            const end = Date.now()
            signale.info(`Done, total time: ${(end - start) / 1000}s`)
          }
        } else {
          signale.success(`[${connectedCount}/${count}] - Client ID: ${opts.clientId}, Reconnected`)
        }
      })

      client.on('error', (err) => {
        signale.error(`[${connectedCount}/${count}] - Client ID: ${opts.clientId}, ${err}`)
        client.end()
      })

      client.on('reconnect', () => {
        signale.await(`[${connectedCount}/${count}] - Client ID: ${opts.clientId}, Reconnecting...`)
        isNewConnArray[i - 1] = false
      })

      client.on('close', () => {
        connectedCount > 0 && (connectedCount -= 1)
        signale.error(`[${connectedCount}/${count}] - Client ID: ${opts.clientId}, Connection closed`)
      })
    })(i, connOpts)

    await delay(interval)
  }
}

export default conn

export { conn, benchConn }
