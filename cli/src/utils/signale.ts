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
}

export { Signale, signale, msgLog, benchLog }

export default signale
