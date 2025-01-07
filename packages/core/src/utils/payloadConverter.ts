import type { PayloadType } from 'mqttx'
// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'
import { encode } from 'cbor2'
import { pack } from 'msgpackr'
import { jsonParse, jsonStringify } from './jsonUtils'

export function convertPayloadForDisplay(
  payload: string,
  fromType: PayloadType,
  toType: PayloadType,
): string {
  let decoded: Buffer
  switch (fromType) {
    case 'Base64':
      decoded = Buffer.from(payload, 'base64')
      break
    case 'Hex':
      decoded = Buffer.from(payload.replace(/ /g, ''), 'hex')
      break
    case 'JSON':
    case 'CBOR':
    case 'MsgPack':
      decoded = Buffer.from(payload)
      break
    default:
      decoded = Buffer.from(payload)
      break
  }

  switch (toType) {
    case 'Plaintext':
      return decoded.toString()
    case 'Base64':
      return decoded.toString('base64')
    case 'JSON':
    case 'CBOR':
    case 'MsgPack':
      return jsonStringify(jsonParse(decoded.toString()), null, 2)
    case 'Hex':
      return decoded.toString('hex').replace(/(.{4})/g, '$1 ')
    default:
      return decoded.toString()
  }
}

export function encodePayloadForSend(payload: string, payloadType: PayloadType): Buffer {
  switch (payloadType) {
    case 'Plaintext':
      return Buffer.from(payload)
    case 'Base64':
      return Buffer.from(payload, 'base64')
    case 'JSON':
      return Buffer.from(jsonStringify(jsonParse(payload)))
    case 'CBOR':
      return Buffer.from(encode(jsonParse(payload)))
    case 'MsgPack':
      return pack(JSON.parse(payload))
    case 'Hex':
      return Buffer.from(payload.replace(/ /g, ''), 'hex')
    default:
      return Buffer.from(payload)
  }
}
