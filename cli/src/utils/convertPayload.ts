import chalk from 'chalk'
import { jsonParse, jsonStringify } from './jsonUtils'
import cbor from 'cbor'
import { pack, unpack } from 'msgpackr'
import { basicLog } from './logWrapper'

type Action = 'encode' | 'decode'

const handleError = (err: unknown, value: Buffer | string, action: Action) => {
  basicLog.error(err as Error)
  return action === 'decode' ? chalk.red(value.toString()) : process.exit(1)
}

/**
 * Converts a JSON payload to a Buffer or string based on the specified action.
 * @param value - The JSON payload to convert.
 * @param action - The action to perform on the payload ('decode' or 'encode').
 * @returns The converted payload.
 */
const convertJSON = (value: Buffer | string, action: Action) => {
  try {
    return action === 'decode'
      ? jsonStringify(jsonParse(value.toString()), null, 2)
      : Buffer.from(jsonStringify(jsonParse(value.toString())))
  } catch (err) {
    return handleError(err, value, action)
  }
}

/**
 * Converts a CBOR payload to JSON or vice versa.
 * @param value - The CBOR payload to convert.
 * @param action - The action to perform: 'decode' to convert CBOR to JSON, 'encode' to convert JSON to CBOR.
 * @returns The converted payload.
 */
const convertCBOR = (value: Buffer | string, action: Action) => {
  try {
    return action === 'decode'
      ? jsonStringify(cbor.decodeFirstSync(value), null, 2)
      : cbor.encodeOne(JSON.parse(value.toString()))
  } catch (err) {
    return handleError(err, value, action)
  }
}

/**
 * Converts a MsgPack payload to JSON or vice versa.
 * @param value - The MsgPack payload to convert.
 * @param action - The action to perform: 'decode' to convert MsgPack to JSON, 'encode' to convert JSON to MsgPack.
 * @returns The converted payload.
 */
const convertMsgPack = (value: Buffer | string, action: Action) => {
  try {
    return action === 'decode' ? jsonStringify(unpack(value as Buffer), null, 2) : pack(JSON.parse(value.toString()))
  } catch (err) {
    return handleError(err, value, action)
  }
}

/**
 * Converts the payload based on the specified format and action.
 * @param payload - The payload to be converted.
 * @param format - The format in which the payload should be converted. (Optional)
 * @param action - The action to be performed on the payload. (Default: 'decode')
 * @returns The converted payload.
 */
const convertPayload = (payload: Buffer | string, format?: FormatType, action: Action = 'decode') => {
  const actions = {
    encode: {
      base64: () => Buffer.from(payload.toString(), 'base64'),
      json: () => convertJSON(payload, 'encode'),
      hex: () => Buffer.from(payload.toString().replace(/\s+/g, ''), 'hex'),
      cbor: () => convertCBOR(payload, 'encode'),
      msgpack: () => convertMsgPack(payload, 'encode'),
      binary: () => payload,
      default: () => Buffer.from(payload.toString(), 'utf-8'),
    },
    decode: {
      base64: () => payload.toString('base64'),
      json: () => convertJSON(payload, 'decode'),
      hex: () => payload.toString('hex').replace(/(.{4})/g, '$1 '),
      cbor: () => convertCBOR(payload, 'decode'),
      msgpack: () => convertMsgPack(payload, 'decode'),
      binary: () => payload,
      default: () => payload.toString('utf-8'),
    },
  }
  const actionSet = actions[action]
  const runAction = actionSet[format || 'default']

  return runAction ? runAction() : payload
}

export default convertPayload
