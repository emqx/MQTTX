import type { FormatType } from 'mqttx'
import chalk from 'chalk'

function convertJSON(value: Buffer | string, action: 'encode' | 'decode') {
  try {
    if (action === 'decode') {
      return JSON.stringify(JSON.parse(value.toString()), null, 2)
    } else {
      return Buffer.from(JSON.stringify(JSON.parse(value.toString())))
    }
  } catch (err) {
    return chalk.red(err)
  }
}

function convertPayload(payload: Buffer | string, format?: FormatType, action: 'encode' | 'decode' = 'decode') {
  const actions = {
    encode: {
      base64: () => Buffer.from(payload.toString(), 'base64'),
      json: () => convertJSON(payload, 'encode'),
      hex: () => Buffer.from(payload.toString().replace(/\s+/g, ''), 'hex'),
      default: () => Buffer.from(payload.toString(), 'utf-8'),
    },
    decode: {
      base64: () => payload.toString('base64'),
      json: () => convertJSON(payload, 'decode'),
      hex: () => payload.toString('hex').replace(/(.{4})/g, '$1 '),
      default: () => payload.toString('utf-8'),
    },
  }
  const actionSet = actions[action]
  const runAction = actionSet[format || 'default']

  return runAction ? runAction() : payload
}

export default convertPayload
