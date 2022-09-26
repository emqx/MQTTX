import signale from '../utils/signale'

const parseNumber = (value: string) => {
  const parsedValue = Number(value)
  if (isNaN(parsedValue)) {
    signale.error('Not a number.')
    process.exit(1)
  }
  return parsedValue
}

const parseProtocol = (value: string) => {
  if (!['mqtt', 'mqtts'].includes(value)) {
    signale.error('Only mqtt and mqtts are supported.')
    process.exit(1)
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
    signale.error('Not a valid MQTT version.')
    process.exit(1)
  }
  return dict[value as '3.1' | '3.1.1' | '5']
}

const parseUserProperties = (value: string, previous: Record<string, unknown> | undefined) => {
  const [key, val] = value.split(': ')
  if (key && val) {
    return previous ? { ...previous, [key]: val } : { [key]: val }
  } else {
    signale.error('Not a valid user properties.')
    process.exit(1)
  }
}

const parseQoS = (value: string, previous: number[] | undefined) => {
  const parsedValue = Number(value)
  if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 2) {
    signale.error(`${value} is not a valid QoS.`)
    process.exit(1)
  } else {
    return previous ? [...previous, parsedValue] : [parsedValue]
  }
}

const parseVariadicOfBooleanType = (value: string, previous: boolean[] | undefined) => {
  if (!['true', 'false'].includes(value)) {
    signale.error(`${value} is not a boolean.`)
    process.exit(1)
  } else {
    const booleanValue = value === 'true'
    return previous ? [...previous, booleanValue] : [booleanValue]
  }
}

const parsePubTopic = (value: string) => {
  if (value.includes('+') || value.includes('#')) {
    signale.error('You cannot publish the message to a Topic that contains wildcards characters #, +')
    process.exit(1)
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
