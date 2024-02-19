import { jsonParse, jsonStringify } from './jsonUtils'

interface CodeType {
  encode: (str: string) => string
  decode: (str: string) => string
}

const convertBase64 = (value: string, codeType: 'encode' | 'decode'): string => {
  const convertMap: CodeType = {
    encode(str: string): string {
      return btoa(unescape(encodeURIComponent(str)))
    },
    decode(str: string): string {
      return decodeURIComponent(escape(atob(str)))
    },
  }
  return convertMap[codeType](value)
}

const convertHex = (value: string, codeType: 'encode' | 'decode'): string => {
  const convertMap: CodeType = {
    encode(str: string): string {
      return Buffer.from(str, 'utf-8')
        .toString('hex')
        .replace(/(.{4})/g, '$1 ')
    },
    decode(str: string): string {
      return Buffer.from(str.replaceAll(' ', ''), 'hex').toString('utf-8')
    },
  }
  return convertMap[codeType](value)
}

const convertJSON = (value: string): Promise<string> =>
  new Promise((resolve, reject) => {
    try {
      let $json = jsonParse(value)
      $json = jsonStringify($json, null, 2)
      return resolve($json)
    } catch (error) {
      return reject(error)
    }
  })

const convertPayload = async (payload: string, currentType: PayloadType, fromType: PayloadType): Promise<string> => {
  let $payload = payload
  switch (fromType) {
    case 'Base64':
      $payload = convertBase64(payload, 'decode')
      break
    case 'Hex':
      $payload = convertHex(payload, 'decode')
      break
  }
  if (currentType === 'Base64') {
    $payload = convertBase64($payload, 'encode')
  }
  if (currentType === 'JSON' || currentType === 'CBOR') {
    $payload = await convertJSON($payload)
  }
  if (currentType === 'Hex') {
    $payload = convertHex($payload, 'encode')
  }
  return $payload
}

export default convertPayload
