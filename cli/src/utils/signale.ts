import { Signale } from 'signale'
import chalk from 'chalk'
import { inspect } from 'util'

const option = {
  config: {
    displayLabel: false,
    displayTimestamp: true,
  },
}

const signale = new Signale(option)

const msgLog = (msg: Record<string, unknown>[]) => {
  let chalkString = ''
  msg.forEach((item) => {
    if (typeof item.value === 'object') {
      chalkString += `${chalk.green(item.label)}: ${inspect(item.value, false, null, true)}\n`
    } else {
      chalkString += `${chalk.green(item.label)}: ${item.value}\n`
    }
  })
  signale.log(`${chalkString}`)
}

const basicLog = {
  connecting: () => signale.await('Connecting...'),
  connected: () => signale.success('Connected'),
  subscribing: (t: string) => signale.await(`Subscribing to ${t}...`),
  subscribed: (t: string) => signale.success(`Subscribed to ${t}`),
  subscriptionNegated: (sub: { topic: string; qos: number }) =>
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

export { Signale, signale, msgLog, basicLog, benchLog }

export default signale
