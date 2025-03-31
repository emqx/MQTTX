import type { OutputFormat } from 'mqttx'
// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'
import { jsonParse, jsonStringify } from './jsonUtils'

function formatPayload(args: {
  payload: string
  from: OutputFormat
  to: OutputFormat
}): string {
  const { payload, from, to } = args
  let decoded: Buffer
  switch (from) {
    case 'Base64':
      decoded = Buffer.from(payload, 'base64')
      break
    case 'Hex':
      decoded = Buffer.from(payload.replace(/ /g, ''), 'hex')
      break
    case 'JSON':
      decoded = Buffer.from(payload)
      break
    default:
      decoded = Buffer.from(payload)
      break
  }

  switch (to) {
    case 'Plaintext':
      return decoded.toString()
    case 'Base64':
      return decoded.toString('base64')
    case 'JSON':
      return jsonStringify(jsonParse(decoded.toString()), null, 2)
    case 'Hex':
      return decoded.toString('hex').replace(/(.{4})/g, '$1 ')
    default:
      return decoded.toString()
  }
}

function toBuffer(args: {
  payload: string
  payloadType: OutputFormat
}): Buffer {
  const { payload, payloadType } = args
  switch (payloadType) {
    case 'Plaintext':
      return Buffer.from(payload)
    case 'Base64':
      return Buffer.from(payload, 'base64')
    case 'JSON':
      return Buffer.from(jsonStringify(jsonParse(payload)))
    case 'Hex':
      return Buffer.from(payload.replace(/ /g, ''), 'hex')
    default:
      return Buffer.from(payload)
  }
}

export const payloadConverter = {
  formatPayload,
  toBuffer,
}
