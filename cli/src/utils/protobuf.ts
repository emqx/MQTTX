import protobuf from 'protobufjs'
import signale from './signale'

const convertObject = (raw: string | Buffer, format?: FormatType | undefined) => {
  switch (format) {
    case 'base64':
      return JSON.parse(Buffer.from(raw.toString('utf-8'), 'base64').toString('utf-8'))
    case 'hex':
      return JSON.parse(Buffer.from(raw.toString('utf-8').replaceAll(' ', ''), 'hex').toString('utf-8'))
    default:
      return JSON.parse(raw.toString('utf-8'))
  }
}

export const serializeProtobufToBuffer = (
  raw: string | Buffer,
  protobufPath: string | undefined,
  protobufMessageName: string | undefined,
  format?: FormatType | undefined,
): Buffer => {
  let bufferMessage = Buffer.from(raw)
  if (protobufPath && protobufMessageName) {
    try {
      const root = protobuf.loadSync(protobufPath)
      const Message = root.lookupType(protobufMessageName)
      const rawData = convertObject(raw, format)
      const err = Message.verify(rawData)
      if (err) {
        signale.warn(err)
      }
      const data = Message.create(rawData)
      const serializedMessage = Message.encode(data).finish()
      bufferMessage = Buffer.from(serializedMessage)
    } catch (err: unknown) {
      signale.warn((err as Error).message.split('\n')[0])
    }
  }
  return bufferMessage
}

export const deserializeBufferToProtobuf = (
  payload: Buffer,
  protobufPath: string | undefined,
  protobufMessageName: string | undefined,
  to?: FormatType,
): any => {
  if (protobufPath && protobufMessageName) {
    try {
      const root = protobuf.loadSync(protobufPath)
      const Message = root.lookupType(protobufMessageName)
      const MessageData = Message.decode(payload)
      if (to) {
        return Buffer.from(JSON.stringify(MessageData.toJSON()))
      }
      return MessageData
    } catch (err: unknown) {
      signale.warn((err as Error).message.split('\n')[0])
    }
  }
}
