import protobuf from 'protobufjs'
import signale from './signale'
import { transformPBJSError } from './protobufErrors'

export const serializeProtobufToBuffer = (
  raw: string | Buffer,
  protobufPath: string,
  protobufMessageName: string,
): Buffer => {
  let rawData = raw.toString('utf-8')
  let bufferMessage = Buffer.from(rawData)
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
  return bufferMessage
}

export const deserializeBufferToProtobuf = (
  payload: Buffer,
  protobufPath: string,
  protobufMessageName: string,
  needFormat: FormatType | undefined,
): any => {
  try {
    const root = protobuf.loadSync(protobufPath)
    const Message = root.lookupType(protobufMessageName)
    const MessageData = Message.decode(payload)
    const err = Message.verify(MessageData)
    if (err) {
      signale.error(`Message deserialization error: ${err}`)
      process.exit(1)
    }
    if (needFormat) {
      return Buffer.from(JSON.stringify(MessageData.toJSON()))
    }
    return MessageData
  } catch (error: unknown) {
    let err = transformPBJSError(error as Error)
    signale.error(err.message.split('\n')[0])
    process.exit(1)
  }
}
