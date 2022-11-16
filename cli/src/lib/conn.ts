import * as mqtt from 'mqtt'
import { Signale, signale, benchLog } from '../utils/signale'
import { parseConnectOptions } from '../utils/parse'
import delay from '../utils/delay'

const conn = (options: ConnectOptions) => {
  const connOpts = parseConnectOptions(options, 'conn')

  const client = mqtt.connect(connOpts)

  const { maximunReconnectTimes } = options

  let retryTimes = 0

  signale.await('Connecting...')

  client.on('connect', () => {
    signale.success('Connected')
    retryTimes = 0
  })

  client.on('error', (err) => {
    signale.error(err)
    client.end()
  })

  client.on('reconnect', () => {
    retryTimes += 1
    if (retryTimes > maximunReconnectTimes) {
      client.end(false, {}, () => {
        signale.error('Exceed the maximum reconnect times limit, stop retry')
      })
    } else {
      signale.await('Reconnecting...')
    }
  })

  client.on('close', () => {
    signale.error('Connection closed')
  })
}

const benchConn = async (options: BenchConnectOptions) => {
  const { count, interval, clientId, maximunReconnectTimes } = options

  const connOpts = parseConnectOptions(options, 'conn')

  let connectedCount = 0

  const isNewConnArray = Array(count).fill(true)

  const retryTimesArray = Array(count).fill(0)

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
        retryTimesArray[i - 1] = 0
        if (isNewConnArray[i - 1]) {
          interactive.success('[%d/%d] - Connected', connectedCount, count)

          if (i === count) {
            const end = Date.now()
            signale.info(`Done, total time: ${(end - start) / 1000}s`)
          }
        } else {
          benchLog.reconnected(connectedCount, count, opts.clientId!)
        }
      })

      client.on('error', (err) => {
        benchLog.error(connectedCount, count, opts.clientId!, err)
        client.end()
      })

      client.on('reconnect', () => {
        retryTimesArray[i - 1] += 1
        if (retryTimesArray[i - 1] > maximunReconnectTimes) {
          client.end(false, {}, () => {
            benchLog.reconnectTimesLimit(connectedCount, count, opts.clientId!)
          })
        } else {
          benchLog.reconnecting(connectedCount, count, opts.clientId!)
          isNewConnArray[i - 1] = false
        }
      })

      client.on('close', () => {
        connectedCount > 0 && (connectedCount -= 1)
        benchLog.close(connectedCount, count, opts.clientId!)
      })
    })(i, connOpts)

    await delay(interval)
  }
}

export default conn

export { conn, benchConn }
