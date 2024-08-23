import { Signale } from 'signale'
import chalk from 'chalk'
import { inspect } from 'util'
import getErrorReason from './mqttErrorReason'
import state from '../state'
import ora from 'ora'

const isLogFormat = state.getConfig('output') === 'log'

const singaleConfig = {
  displayLabel: false,
  displayDate: isLogFormat,
  displayTimestamp: isLogFormat,
  displayScope: false,
}

const signale = new Signale({
  config: singaleConfig,
  types: {
    running: {
      badge: '❯',
      color: 'yellow',
      label: 'Running',
    },
  },
})
const spinner = ora()

const logWrapper = {
  await: (msg: string) => (isLogFormat ? signale.await(msg) : spinner.start(msg)),
  success: (msg: string) => (isLogFormat ? signale.success(msg) : spinner.succeed(msg)),
  fail: (msg: string) => (isLogFormat ? signale.error(msg) : spinner.fail(msg)),
  warn: (msg: string) => (isLogFormat ? signale.warn(msg) : spinner.warn(msg)),
  info: (msg: string) => (isLogFormat ? signale.info(msg) : spinner.info(msg)),
  log: (msg: string) => signale.log(msg),
  running: (msg: string) => signale.running(msg),
}

const formatValue = (value: any) => (typeof value === 'object' ? inspect(value, false, null, true) : value)

const msgLog = (msg: MsgItem[]) => {
  const payloadItems = msg.filter((item) => item.label === 'payload')
  const subInfoItems = msg.filter((item) => item.label !== 'payload')

  const payloadStrings = payloadItems.map((item) => formatValue(item.value))
  const subInfoStrings = subInfoItems.map((item) => `${chalk.green(item.label)}: ${formatValue(item.value)}`)
  const outputString = `${subInfoStrings.join(', ')}\n${payloadStrings.join('\n')}`
  signale.log(isLogFormat ? outputString : `${outputString}\n`)
}

const basicLog = {
  connecting: (config: boolean | string | undefined, host: string, port = 1883, topic?: string, message?: string) => {
    if (!config) {
      logWrapper.await('Connecting...')
    } else {
      logWrapper.await(
        `Connecting using configuration file, host: ${host}, port: ${port}${topic ? `, topic: ${topic}` : ''}${
          message ? `, message: ${message}` : ''
        }`,
      )
    }
  },
  connected: () => logWrapper.success('Connected'),
  subscribing: (t: string) => logWrapper.await(`Subscribing to ${t}...`),
  subscribed: (t: string) => logWrapper.success(`Subscribed to ${t}`),
  subscriptionNegated: (sub: { topic: string; qos: number }, clientId?: string) => {
    let errorLog = `Subscription negated to "${sub.topic}" with code ${sub.qos}`
    if (clientId) {
      errorLog = `Client ID: ${clientId}, ${errorLog}`
    }
    logWrapper.fail(errorLog)
  },
  publishing: () => logWrapper.await('Message publishing...'),
  published: () => logWrapper.success('Message published'),
  enterToPublish: () => logWrapper.success('Connected, press Enter to publish, press Ctrl+C to exit'),
  error: (err: Error) => logWrapper.fail(err.toString()),
  close: () => logWrapper.fail('Connection closed'),
  reconnecting: (retryTimes: number, maxReTryTimes: number) =>
    logWrapper.await(`Reconnecting...[${retryTimes}/${maxReTryTimes}]`),
  reconnectTimesLimit: () => logWrapper.fail('Exceed the maximum reconnect times limit, stop retry'),
  disconnect: (packet: IDisconnectPacket, clientId?: string) => {
    const { reasonCode } = packet
    const reason = reasonCode === 0 ? 'Normal disconnection' : getErrorReason(reasonCode)
    logWrapper.warn(
      `${
        clientId ? `Client ID: ${clientId}, ` : ''
      }The Broker has actively disconnected, Reason: ${reason} (Code: ${reasonCode})`,
    )
  },
  fileReading: () => logWrapper.await('Reading file...'),
  fileReadSuccess: () => logWrapper.success('Read file successfully'),
}

const benchLog = {
  start: {
    conn: (config: boolean | string | undefined, count: number, interval: number, host: string, port = 1883) => {
      if (!config) {
        logWrapper.running(`Starting connect benchmark, connections: ${count}, req interval: ${interval}ms`)
      } else {
        logWrapper.running(
          `Starting connect benchmark, connections: ${count}, req interval: ${interval}ms, host: ${host}, port: ${port}`,
        )
      }
    },
    sub: (
      config: boolean | string | undefined,
      count: number,
      interval: number,
      host: string,
      port = 1883,
      topic: string,
    ) => {
      if (!config) {
        logWrapper.running(
          `Starting subscribe benchmark, connections: ${count}, req interval: ${interval}ms, topic: ${topic}`,
        )
      } else {
        logWrapper.running(
          `Starting subscribe benchmark, connections: ${count}, req interval: ${interval}ms, host: ${host}, port: ${port}, topic: ${topic}`,
        )
      }
    },
    pub: (
      config: boolean | string | undefined,
      count: number,
      interval: number,
      messageInterval: number,
      host: string,
      port = 1883,
      topic: string,
      message: string,
    ) => {
      if (!config) {
        logWrapper.running(
          `Starting publish benchmark, connections: ${count}, req interval: ${interval}ms, message interval: ${messageInterval}ms`,
        )
      } else {
        logWrapper.running(
          `Starting publish benchmark, connections: ${count}, req interval: ${interval}ms, message interval: ${messageInterval}ms, host: ${host}, port: ${port}, topic: ${topic}, message: ${message}`,
        )
      }
    },
  },
  error: (count: number, total: number, id: string, err: Error) =>
    logWrapper.fail(`[${count}/${total}] - Client ID: ${id}, ${err}`),
  close: (count: number, total: number, id: string) =>
    logWrapper.fail(`[${count}/${total}] - Client ID: ${id}, Connection closed`),
  reconnecting: (count: number, total: number, id: string) =>
    logWrapper.await(`[${count}/${total}] - Client ID: ${id}, Reconnecting...`),
  reconnected: (count: number, total: number, id: string) =>
    logWrapper.success(`[${count}/${total}] - Client ID: ${id}, Reconnected`),
  reconnectTimesLimit: (count: number, total: number, id: string) =>
    logWrapper.fail(`[${count}/${total}] - Client ID: ${id}, Exceed the maximum reconnect times limit, stop retry`),
}

const simulateLog = {
  start: {
    pub: (
      config: boolean | string | undefined,
      count: number,
      interval: number,
      messageInterval: number,
      host: string,
      port = 1883,
      topic: string,
      scenario: string,
    ) => {
      let message = `Starting publish simulation, scenario: ${scenario}, connections: ${count}, req interval: ${interval}ms, message interval: ${messageInterval}ms`
      if (config) {
        message += `, host: ${host}, port: ${port}, topic: ${topic}`
      }
      logWrapper.running(message)
    },
  },
}

export { Signale, signale, singaleConfig, spinner, msgLog, basicLog, benchLog, simulateLog }

export default logWrapper
