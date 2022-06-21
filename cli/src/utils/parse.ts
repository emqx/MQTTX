import { Command } from 'commander'

const program = new Command()

const parseNumber = (value: string) => {
  const parsedValue = Number(value)
  if (isNaN(parsedValue)) {
    program.error('Not a number.')
  }
  return parsedValue
}

const parseProtocol = (value: string) => {
  if (!['mqtt', 'mqtts', 'ws', 'wss'].includes(value)) {
    program.error('Not mqtt, mqtts, ws or wss.')
  }
  return value
}

export { parseNumber, parseProtocol }
