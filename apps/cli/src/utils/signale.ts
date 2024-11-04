import { inspect } from 'node:util'
import chalk from 'chalk'
import { Signale } from 'signale'

const option = {
  config: {
    displayLabel: false,
    displayDate: true,
    displayTimestamp: true,
  },
}

const signale = new Signale(option)

function msgLog(msg: Record<string, unknown>[]) {
  let chalkString = ''
  msg.forEach((item) => {
    if (typeof item.value === 'object') {
      chalkString += `${chalk.green(item.label)}: ${inspect(item.value, false, null, true)}\n`
    }
    else {
      chalkString += `${chalk.green(item.label)}: ${item.value}\n`
    }
  })
  signale.log(`${chalkString}`)
}

const basicLog = {
  connecting: (config: boolean | string | undefined, host: string, port = 1883, topic?: string, message?: string) => {
    if (!config) {
      signale.await('Connecting...')
    }
    else {
      signale.await(
        `Connecting using configuration file, host: ${host}, port: ${port}${topic ? `, topic: ${topic}` : ''}${
          message ? `, message: ${message}` : ''
        }`,
      )
    }
  },
  connected: () => signale.success('Connected'),
  subscribing: (t: string) => signale.await(`Subscribing to ${t}...`),
  subscribed: (t: string) => signale.success(`Subscribed to ${t}`),
  subscriptionNegated: (sub: { topic: string, qos: number }) =>
    signale.error(`Subscription negated to ${sub.topic} with code ${sub.qos}`),
  publishing: () => signale.await('Message publishing...'),
  published: () => signale.success('Message published'),
  enterToPublish: () => signale.success('Connected, press Enter to publish, press Ctrl+C to exit'),
  error: (err: Error) => signale.error(err),
  close: () => signale.error('Connection closed'),
  reconnecting: () => signale.await('Reconnecting...'),
  reconnectTimesLimit: () => signale.error('Exceed the maximum reconnect times limit, stop retry'),
}

const benchLog = {
  start: {
    conn: (config: boolean | string | undefined, count: number, interval: number, host: string, port = 1883) => {
      if (!config) {
        signale.info(`Start the connect benchmarking, connections: ${count}, req interval: ${interval}ms`)
      }
      else {
        signale.info(
          `Start the connect benchmarking, connections: ${count}, req interval: ${interval}ms, host: ${host}, port: ${port}`,
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
        signale.info(
          `Start the subscribe benchmarking, connections: ${count}, req interval: ${interval}ms, topic: ${topic}`,
        )
      }
      else {
        signale.info(
          `Start the subscribe benchmarking, connections: ${count}, req interval: ${interval}ms, host: ${host}, port: ${port}, topic: ${topic}`,
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
        signale.info(
          `Start the publish benchmarking, connections: ${count}, req interval: ${interval}ms, message interval: ${messageInterval}ms`,
        )
      }
      else {
        signale.info(
          `Start the publish benchmarking, connections: ${count}, req interval: ${interval}ms, message interval: ${messageInterval}ms, host: ${host}, port: ${port}, topic: ${topic}, message: ${message}`,
        )
      }
    },
  },
  error: (count: number, total: number, id: string, err: Error) => {
    signale.error(`[${count}/${total}] - Client ID: ${id}, ${err}`)
  },
  close: (count: number, total: number, id: string) => {
    signale.error(`[${count}/${total}] - Client ID: ${id}, Connection closed`)
  },
  reconnecting: (count: number, total: number, id: string) => {
    signale.await(`[${count}/${total}] - Client ID: ${id}, Reconnecting...`)
  },
  reconnected: (count: number, total: number, id: string) => {
    signale.success(`[${count}/${total}] - Client ID: ${id}, Reconnected`)
  },
  reconnectTimesLimit: (count: number, total: number, id: string) => {
    signale.error(`[${count}/${total}] - Client ID: ${id}, Exceed the maximum reconnect times limit, stop retry`)
  },
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
      let message = `Start simulation publishing, scenario: ${scenario}, connections: ${count}, req interval: ${interval}ms, message interval: ${messageInterval}ms`
      if (config) {
        message += `, host: ${host}, port: ${port}, topic: ${topic}`
      }
      signale.info(message)
    },
  },
}

export { basicLog, benchLog, msgLog, Signale, signale, simulateLog }

export default signale
