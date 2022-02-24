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
      return Buffer.from(str, 'utf-8').toString('hex')
    },
    decode(str: string): string {
      return Buffer.from(str, 'hex').toString('utf-8')
    },
  }
  return convertMap[codeType](value)
}

const convertJSON = (value: string): Promise<string> =>
  new Promise((resolve, reject) => {
    try {
      let $json = JSON.parse(value)
      $json = JSON.stringify($json, null, 2)
      return resolve($json)
    } catch (error) {
      return reject(error)
    }
  })

const convertPayload = async (payload: string, currentType: PayloadType, fromType: PayloadType): Promise<string> => {
  let _payload = payload
  switch (fromType) {
    case 'Base64':
      _payload = convertBase64(payload, 'decode')
      break
    case 'Hex':
      _payload = convertHex(payload, 'decode')
      break
  }
  if (currentType === 'Base64') {
    _payload = convertBase64(_payload, 'encode')
  }
  if (currentType === 'JSON') {
    _payload = await convertJSON(_payload)
  }
  if (currentType === 'Hex') {
    _payload = convertHex(_payload, 'encode')
  }
  return _payload
}

export default convertPayload
