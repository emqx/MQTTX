import * as mqtt from 'mqtt'
import cluster from 'cluster'
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
  if (cluster.isPrimary) {
    const { save, config } = options

    config && (options = loadConfig('benchConn', config))

    save && saveConfig('benchConn', options)

    const { count, interval, cores, hostname, port, clientId, maximumReconnectTimes } = options

    const connOpts = parseConnectOptions(options, 'conn')

    let connectedCount = 0

    const isNewConnArray = Array(count).fill(true)

    const retryTimesArray = Array(count).fill(0)

    const interactive = new Signale({ interactive: true })

    benchLog.start.conn(config, count, interval, hostname, port)

    const start = Date.now()

    let startConnIndex = 1

    for (let i = 0; i < cores; i++) {
      const worker = cluster.fork()

      let masterMessage: ConnMasterMessage
      const connCount = Math.floor(count / cores) + (i < count % cores ? 1 : 0)
      const endConnIndex = startConnIndex + connCount - 1

      masterMessage = {
        type: 'init',
        data: {
          startConnIndex,
          endConnIndex,
          options,
          connOpts,
        },
      }
      worker.send(masterMessage)

      startConnIndex += connCount

      worker.on('message', (msg: ConnWorkerMessage) => {
        const { type } = msg
        if (type === 'connecting') {
          interactive.await('[%d/%d] - Connecting...', connectedCount, count)
        }
        if (type === 'connected') {
          const { clientIndex } = msg.data
          connectedCount += 1
          retryTimesArray[clientIndex - 1] = 0
          if (isNewConnArray[clientIndex - 1]) {
            interactive.success('[%d/%d] - Connected', connectedCount, count)

            if (connectedCount === count) {
              const end = Date.now()
              signale.info(`Done, total time: ${(end - start) / 1000}s`)
            }
          } else {
            benchLog.reconnected(connectedCount, count, clientId)
          }
        }
        if (type === 'error') {
          const {
            opts: { clientId },
            error,
          } = msg.data
          benchLog.error(connectedCount, count, clientId!, error)
        }
        if (type === 'reconnect') {
          const {
            opts: { clientId },
          } = msg.data
          retryTimesArray[i - 1] += 1
          if (retryTimesArray[i - 1] > maximumReconnectTimes) {
            // TODO: Force close connection
            // client.end(false, {}, () => {
            //   benchLog.reconnectTimesLimit(connectedCount, count, clientId!)
            // })
          } else {
            benchLog.reconnecting(connectedCount, count, clientId!)
            isNewConnArray[i - 1] = false
          }
        }
        if (type === 'close') {
          const {
            opts: { clientId },
          } = msg.data
          connectedCount > 0 && (connectedCount -= 1)
          benchLog.close(connectedCount, count, clientId!)
        }
        if (type === 'disconnect') {
          const {
            opts: { clientId },
          } = msg.data
          basicLog.disconnect(clientId!)
        }
      })
    }
  } else if (cluster.isWorker) {
    process.on('message', async (msg: ConnMasterMessage) => {
      const { type, data } = msg
      if (type === 'init') {
        let workerMessage: ConnWorkerMessage
        const { startConnIndex, endConnIndex, options, connOpts } = data
        const { interval, clientId } = options
        for (let i = startConnIndex; i <= endConnIndex; i++) {
          ;((i: number, connOpts: mqtt.IClientOptions) => {
            const opts = { ...connOpts }

            opts.clientId = clientId.includes('%i') ? clientId.replaceAll('%i', i.toString()) : `${clientId}_${i}`

            const client = mqtt.connect(opts)

            workerMessage = { type: 'connecting' }
            process.send!(workerMessage)

            client.on('connect', () => {
              workerMessage = { type: 'connected', data: { clientIndex: i } }
              process.send!(workerMessage)
            })

            client.on('error', (err) => {
              workerMessage = { type: 'error', data: { opts, error: err } }
              process.send!(workerMessage, undefined, undefined, () => {
                client.end()
              })
            })

            client.on('reconnect', () => {
              workerMessage = { type: 'reconnect', data: { opts } }
              process.send!(workerMessage)
            })

            client.on('close', () => {
              workerMessage = { type: 'close', data: { opts } }
              process.send!(workerMessage)
            })

            client.on('disconnect', () => {
              workerMessage = { type: 'disconnect', data: { opts } }
              process.send!(workerMessage)
            })
          })(i, connOpts)

          await delay(interval)
        }
      }
    })
  }
}

export default conn

export { conn, benchConn }
