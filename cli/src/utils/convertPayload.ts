import chalk from 'chalk'

const convertJSON = (value: Buffer) => {
  try {
    return JSON.parse(value.toString())
  } catch (err) {
    return chalk.red(err)
  }
}

const convertPayload = (payload: Buffer, to?: FormatType) => {
  let $payload = ''
  switch (to) {
    case 'base64':
      $payload = payload.toString('base64')
      break
    case 'json':
      $payload = convertJSON(payload)
      break
    case 'hex':
      $payload = payload.toString('hex').replace(/(.{4})/g, '$1 ')
      break
    default:
      $payload = payload.toString('utf-8')
  }
  return $payload
}

export default convertPayload
