import * as mqtt from 'mqtt'
import { Signale, basicLog, benchLog, signale, singaleConfig } from '../utils/logWrapper'
import { parseConnectOptions, validateClientCount } from '../utils/parse'
import delay from '../utils/delay'
import { handleSaveOptions, handleLoadOptions } from '../utils/options'
import * as Debug from 'debug'
import { triggerExitInfo } from '../utils/exitInfo'
import getBenchClientId from '../utils/getBenchClientId'
import { createMqttClient } from '../utils/mqttConnect'
import shouldRetryConnectionError from '../utils/shouldRetryConnectionError'

const conn = (options: ConnectOptions) => {
  const { debug, saveOptions, loadOptions } = options

  loadOptions && (options = handleLoadOptions('conn', loadOptions, options))

  saveOptions && handleSaveOptions('conn', options)

  debug && Debug.enable('mqttjs*')

  const { maximumReconnectTimes } = options

  const connOpts = parseConnectOptions(options, 'conn')

  const client = createMqttClient(connOpts)

  let retryTimes = 0

  basicLog.connecting(loadOptions, connOpts.hostname!, connOpts.port)

  client.on('connect', (packet) => {
    basicLog.connected()
    basicLog.responseInformation(connOpts, packet)
    retryTimes = 0
    setTimeout(triggerExitInfo, 1000)
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

  validateClientCount(options.count)

  saveOptions && handleSaveOptions('benchConn', options)

  const { count, interval, hostname, port, clientId, maximumReconnectTimes } = options

  const connOpts = parseConnectOptions(options, 'conn')

  let connectedCount = 0

  let exhaustedCount = 0

  let isLogged = false

  const interactiveConn = new Signale({ interactive: true, config: singaleConfig })

  benchLog.start.conn(loadOptions, count, interval, hostname, port)

  const start = Date.now()

  for (let i = 1; i <= count; i++) {
    ;((i: number, connOpts: mqtt.IClientOptions) => {
      const opts = { ...connOpts }

      opts.clientId = getBenchClientId(clientId, i, count)

      const client = createMqttClient(opts)
      let hasConnected = false
      let isConnected = false
      let retryTimes = 0

      interactiveConn.await('[%d/%d] - Connecting...', connectedCount, count)

      client.on('connect', () => {
        connectedCount += 1
        isConnected = true
        retryTimes = 0
        if (!hasConnected) {
          hasConnected = true
          interactiveConn.success('[%d/%d] - Connected', connectedCount, count)
        } else {
          benchLog.reconnected(connectedCount, count, opts.clientId!)
        }

        if (connectedCount === count && !isLogged) {
          isLogged = true
          const end = Date.now()
          signale.success(`Created ${count} connections in ${(end - start) / 1000}s`)
          setTimeout(triggerExitInfo, 1000)
        }
      })

      client.on('error', (err) => {
        benchLog.error(connectedCount, count, opts.clientId!, err)
        if (!shouldRetryConnectionError(err, opts.reconnectPeriod)) {
          client.end(true, {}, () => process.exit(1))
        }
      })

      client.on('reconnect', () => {
        retryTimes += 1
        if (retryTimes > maximumReconnectTimes) {
          client.end(true, {}, () => {
            benchLog.reconnectTimesLimit(connectedCount, count, opts.clientId!)
            exhaustedCount += 1
            if (!isLogged || exhaustedCount === count) {
              process.exit(1)
            }
          })
        } else {
          benchLog.reconnecting(connectedCount, count, opts.clientId!)
        }
      })

      client.on('close', () => {
        if (isConnected) {
          connectedCount -= 1
          isConnected = false
        }
        benchLog.close(connectedCount, count, opts.clientId!)
        if (!client.disconnecting && opts.reconnectPeriod === 0) {
          process.exit(1)
        }
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
