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

const parseMQTTVersion = (value: string) => {
  const dict = {
    '3.1': 3,
    '3.1.1': 4,
    '5': 5,
  }
  if (!Object.keys(dict).includes(value)) {
    program.error('Not a valid MQTT version.')
  }
  return dict[value as '3.1' | '3.1.1' | '5']
}

export { parseNumber, parseProtocol, parseMQTTVersion }
