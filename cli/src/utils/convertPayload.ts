import chalk from 'chalk'

const convertJSON = (value: Buffer) => {
  try {
    return JSON.stringify(JSON.parse(value.toString()), null, 2)
  } catch (err) {
    return chalk.red(err)
  }
}

const convertPayload = (payload: Buffer, to?: FormatType) => {
  switch (to) {
    case 'base64':
      return payload.toString('base64')
    case 'json':
      return convertJSON(payload)
    case 'hex':
      return payload.toString('hex').replace(/(.{4})/g, '$1 ')
    default:
      return payload.toString('utf-8')
  }
}

export default convertPayload
