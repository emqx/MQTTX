import * as mqtt from 'mqtt'
import { Signale, basicLog, benchLog, signale, singaleConfig } from '../utils/logWrapper'
import { parseConnectOptions } from '../utils/parse'
import delay from '../utils/delay'
import { handleSaveOptions, handleLoadOptions } from '../utils/options'
import * as Debug from 'debug'

const conn = (options: ConnectOptions) => {
  const { debug, saveOptions, loadOptions } = options

  loadOptions && (options = handleLoadOptions('conn', loadOptions, options))

  saveOptions && handleSaveOptions('conn', options)

  debug && Debug.enable('mqttjs*')

  const { maximumReconnectTimes } = options

  const connOpts = parseConnectOptions(options, 'conn')

  const client = mqtt.connect(connOpts)

  let retryTimes = 0

  basicLog.connecting(loadOptions, connOpts.hostname!, connOpts.port)

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
      basicLog.reconnecting(retryTimes, maximumReconnectTimes)
    }
  })

  client.on('close', () => {
    basicLog.close()
  })

  client.on('disconnect', (packet: IDisconnectPacket) => {
    basicLog.disconnect(packet)
  })
}

const benchConn = async (options: BenchConnectOptions) => {
  const { saveOptions, loadOptions } = options

  loadOptions && (options = handleLoadOptions('benchConn', loadOptions, options))

  saveOptions && handleSaveOptions('benchConn', options)

  const { count, interval, hostname, port, clientId, maximumReconnectTimes } = options

  const connOpts = parseConnectOptions(options, 'conn')

  let connectedCount = 0

  const isNewConnArray = Array(count).fill(true)

  const retryTimesArray = Array(count).fill(0)

  const interactiveConn = new Signale({ interactive: true, config: singaleConfig })

  benchLog.start.conn(loadOptions, count, interval, hostname, port)

  const start = Date.now()

  for (let i = 1; i <= count; i++) {
    ;((i: number, connOpts: mqtt.IClientOptions) => {
      const opts = { ...connOpts }

      opts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

      const client = mqtt.connect(opts)

      interactiveConn.await('[%d/%d] - Connecting...', connectedCount, count)

      client.on('connect', () => {
        connectedCount += 1
        retryTimesArray[i - 1] = 0
        if (isNewConnArray[i - 1]) {
          interactiveConn.success('[%d/%d] - Connected', connectedCount, count)

          if (connectedCount === count) {
            const end = Date.now()
            signale.success(`Created ${count} connections in ${(end - start) / 1000}s`)
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

      client.on('disconnect', (packet: IDisconnectPacket) => {
        basicLog.disconnect(packet, opts.clientId!)
      })
    })(i, connOpts)

    await delay(interval)
  }
}

export default conn

export { conn, benchConn }
