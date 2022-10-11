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

export { Signale, signale, msgLog }

export default signale
