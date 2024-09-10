export const convertObject = (raw: string, format?: PayloadType): string => {
  switch (format) {
    case 'Base64':
      return Buffer.from(raw, 'base64').toString('utf-8')
    case 'Hex':
      return Buffer.from(raw.replaceAll(' ', ''), 'hex').toString('utf-8')
    case 'JSON':
      return JSON.stringify(JSON.parse(raw))
    default:
      return raw
  }
}
