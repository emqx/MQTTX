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
  if (!['mqtt', 'mqtts'].includes(value)) {
    program.error('Only mqtt and mqtts are supported.')
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

const parseUserProperties = (value: string, previous: Record<string, unknown> | undefined) => {
  const [key, val] = value.split(': ')
  if (key && val) {
    return previous ? { ...previous, [key]: val } : { [key]: val }
  } else {
    program.error('Not a valid user properties.')
  }
}

const parseQoS = (value: string, previous: number[] | undefined) => {
  const parsedValue = Number(value)
  if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 2) {
    program.error(`${value} is not a valid QoS.`)
  } else {
    return previous ? [...previous, parsedValue] : [parsedValue]
  }
}

const parseVariadicOfBooleanType = (value: string, previous: boolean[] | undefined) => {
  if (!['true', 'false'].includes(value)) {
    program.error(`${value} is not a boolean.`)
  } else {
    const booleanValue = value === 'true'
    return previous ? [...previous, booleanValue] : [booleanValue]
  }
}

const parsePubTopic = (value: string) => {
  if (value.includes('+') || value.includes('#')) {
    program.error('You cannot publish the message to a Topic that contains wildcards characters #, +')
  }
  return value
}

export {
  parseNumber,
  parseProtocol,
  parseMQTTVersion,
  parseUserProperties,
  parseQoS,
  parseVariadicOfBooleanType,
  parsePubTopic,
}
