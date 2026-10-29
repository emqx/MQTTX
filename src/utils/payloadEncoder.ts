import cbor from 'cbor'
import { pack } from 'msgpackr'
import validFormatJson from './validFormatJson'

/**
 * Editor language for a payload type. Binary formats are written as JSON.
 */
export const payloadTypeToEditorLang = (type: PayloadType): string => {
  switch (type) {
    case 'JSON':
    case 'CBOR':
    case 'MsgPack':
      return 'json'
    default:
      return 'plaintext'
  }
}

/**
 * Encode editor text into the payload to send.
 * `Plaintext` and `JSON` stay strings; other types become a Buffer.
 * Throws if the text is not valid for the type.
 */
export const encodePayloadByType = (value: string, type: PayloadType = 'Plaintext'): Buffer | string => {
  switch (type) {
    case 'Base64':
      return Buffer.from(value, 'base64')
    case 'Hex':
      return Buffer.from(value.replaceAll(' ', ''), 'hex')
    case 'JSON':
      validFormatJson(value)
      return value
    case 'CBOR':
      return cbor.encodeOne(JSON.parse(value))
    case 'MsgPack':
      return pack(JSON.parse(value))
    default:
      return value
  }
}

/**
 * Check that a payload is valid for the given type.
 * Base64 and Hex are checked by hand because `Buffer.from` ignores bad characters.
 *
 * @returns `undefined` if valid, otherwise the error reason.
 */
export const validatePayloadByType = (value: string, type: PayloadType = 'Plaintext'): string | undefined => {
  if (!value) {
    return undefined
  }
  switch (type) {
    case 'Base64': {
      const normalized = value.replace(/\s/g, '')
      if (normalized.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
        return 'Invalid Base64 string'
      }
      return undefined
    }
    case 'Hex': {
      const normalized = value.replace(/\s/g, '')
      if (normalized.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(normalized)) {
        return 'Invalid Hex string'
      }
      return undefined
    }
    default:
      try {
        encodePayloadByType(value, type)
        return undefined
      } catch (error) {
        return (error as Error).message
      }
  }
}

export default encodePayloadByType
