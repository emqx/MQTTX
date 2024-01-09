import * as mqtt from 'mqtt'
import { Signale, signale, basicLog, benchLog } from '../utils/signale'
import { parseConnectOptions } from '../utils/parse'
import delay from '../utils/delay'
import { saveConfig, loadConfig } from '../utils/config'
import * as Debug from 'debug'

const conn = (options: ConnectOptions) => {
  const { debug, save, config } = options

  config && (options = loadConfig('conn', config))

  save && saveConfig('conn', options)

  debug && Debug.enable('mqttjs*')

  const { maximumReconnectTimes } = options

  const connOpts = parseConnectOptions(options, 'conn')

  const client = mqtt.connect(connOpts)

  let retryTimes = 0

  basicLog.connecting(config, connOpts.hostname!, connOpts.port)

  client.on('connect', () => {
    basicLog.connected()
    retryTimes = 0
  })

  client.on('error', (err) => {
    basicLog.error(err)
    client.end()
  })

  client.on('reconnect', () => {
    retryTimes += 1
    if (retryTimes > maximumReconnectTimes) {
      client.end(false, {}, () => {
        basicLog.reconnectTimesLimit()
      })
    } else {
      basicLog.reconnecting()
    }
  })

  client.on('close', () => {
    basicLog.close()
  })

  client.on('disconnect', () => {
    basicLog.disconnect()
  })
}

const benchConn = async (options: BenchConnectOptions) => {
  const { save, config } = options

  config && (options = loadConfig('benchConn', config))

  save && saveConfig('benchConn', options)

  const { count, interval, hostname, port, clientId, maximumReconnectTimes } = options

  const connOpts = parseConnectOptions(options, 'conn')

  let connectedCount = 0

  const isNewConnArray = Array(count).fill(true)

  const retryTimesArray = Array(count).fill(0)

  const interactive = new Signale({ interactive: true })

  benchLog.start.conn(config, count, interval, hostname, port)

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

          if (connectedCount === count) {
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
        if (retryTimesArray[i - 1] > maximumReconnectTimes) {
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

      client.on('disconnect', () => {
        basicLog.disconnect(opts.clientId!)
      })
    })(i, connOpts)

    await delay(interval)
  }
}

export default conn

export { conn, benchConn }
