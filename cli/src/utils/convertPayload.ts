import { signale } from '../utils/signale'

interface CodeType {
  encode: (str: string) => string
  decode: (str: string) => string
}

const convertBase64 = (value: string, codeType: 'encode' | 'decode') => {
  const convertMap: CodeType = {
    encode(str) {
      return Buffer.from(str, 'utf-8').toString('base64')
    },
    decode(str) {
      return Buffer.from(str, 'base64').toString('utf-8')
    },
  }
  return convertMap[codeType](value)
}

const convertHex = (value: string, codeType: 'encode' | 'decode') => {
  const convertMap: CodeType = {
    encode(str) {
      return Buffer.from(str, 'utf-8').toString('hex')
    },
    decode(str) {
      return Buffer.from(str, 'hex').toString('utf-8')
    },
  }
  return convertMap[codeType](value)
}

const convertJSON = (value: string) => {
  try {
    return JSON.parse(value)
  } catch (err) {
    signale.error(err)
    process.exit(1)
  }
}

const convertPayload = (payload: string, from: PayloadType) => {
  let $payload: string | Object = payload
  switch (from) {
    case 'base64':
      $payload = convertBase64(payload, 'decode')
      break
    case 'json':
      $payload = convertJSON(payload)
      break
    case 'hex':
      $payload = convertHex(payload, 'decode')
      break
  }
  return $payload
}

export default convertPayload
