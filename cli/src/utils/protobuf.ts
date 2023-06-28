import protobuf from 'protobufjs'
import signale from './signale'
import { transformPBJSError } from './protobufErrors'

const convertObject = (raw: string | Buffer, format?: FormatType | undefined) => {
  switch (format) {
    case 'base64':
      return Buffer.from(raw.toString('utf-8'), 'base64').toString('utf-8')
    case 'hex':
      return Buffer.from(raw.toString('utf-8').replaceAll(' ', ''), 'hex').toString('utf-8')
    case 'json':
      return JSON.stringify(JSON.parse(raw.toString('utf-8')), null, 2)
    default:
      return raw.toString('utf-8')
  }
}

export const serializeProtobufToBuffer = (
  raw: string | Buffer,
  protobufPath: string | undefined,
  protobufMessageName: string | undefined,
  format?: FormatType | undefined,
): Buffer => {
  let rawData
  try {
    rawData = convertObject(raw, format)
  } catch (error: unknown) {
    signale.error(`Message format type error : ${(error as Error).message.split('\n')[0]}`)
    process.exit(1)
  }

  let bufferMessage = Buffer.from(rawData)
  if (protobufPath && protobufMessageName) {
    try {
      const root = protobuf.loadSync(protobufPath)
      const Message = root.lookupType(protobufMessageName)
      const err = Message.verify(JSON.parse(rawData))
      if (err) {
        signale.error(`Message serialization error: ${err}`)
        process.exit(1)
      }
      const data = Message.create(JSON.parse(rawData))
      const serializedMessage = Message.encode(data).finish()
      bufferMessage = Buffer.from(serializedMessage)
    } catch (error: unknown) {
      signale.error(`Message serialization error: ${(error as Error).message.split('\n')[0]}`)
      process.exit(1)
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
      const err = Message.verify(MessageData)
      if (err) {
        signale.error(`Message deserialization error: ${err}`)
        process.exit(1)
      }
      if (to) {
        return Buffer.from(JSON.stringify(MessageData.toJSON()))
      }
      return MessageData
    } catch (error: unknown) {
      let err = transformPBJSError(error as Error)
      signale.error(err.message.split('\n')[0])
      process.exit(1)
    }
  }
}
