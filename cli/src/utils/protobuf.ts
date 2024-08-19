import protobuf from 'protobufjs'
import logWrapper from './logWrapper'
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
      logWrapper.fail(`Message serialization error: ${err}`)
      process.exit(1)
    }
    const data = Message.create(JSON.parse(rawData))
    const serializedMessage = Message.encode(data).finish()
    bufferMessage = Buffer.from(serializedMessage)
  } catch (error: unknown) {
    logWrapper.fail(`Message serialization error: ${(error as Error).message.split('\n')[0]}`)
    process.exit(1)
  }
  return bufferMessage
}

export const deserializeBufferToProtobuf = (
  payload: Buffer,
  protobufPath: string,
  protobufMessageName: string,
  needFormat: FormatType | undefined,
): string | Buffer => {
  try {
    const root = protobuf.loadSync(protobufPath)
    const Message = root.lookupType(protobufMessageName)
    const MessageData = Message.decode(payload)
    const err = Message.verify(MessageData)
    if (err) {
      logWrapper.fail(`Message deserialization error: ${err}`)
      process.exit(1)
    }
    if (needFormat) {
      return Buffer.from(JSON.stringify(MessageData.toJSON()))
    }
    return JSON.stringify(MessageData.toJSON())
  } catch (error: unknown) {
    let err = transformPBJSError(error as Error)
    logWrapper.fail(err.message.split('\n')[0])
    process.exit(1)
  }
}
