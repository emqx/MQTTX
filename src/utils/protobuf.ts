import protobuf from 'protobufjs'
import { transformPBJSError } from './protobufErrors'

export const printObjectAsString = (obj: any, indent = 2) => {
  const indentation = ' '.repeat(indent)
  let str = `{\n`
  const keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = obj[key]
    str += `${indentation}  ${key}: `
    if (typeof value === 'object' && value !== null) {
      str += `${printObjectAsString(value, indent + 2)}`
    } else {
      str += `${JSON.stringify(value)}`
    }
    if (i < keys.length - 1) {
      str += `,`
    }
    str += `\n`
  }
  str += `${indentation}}`
  return str
}

const convertObject = (raw: string, format?: PayloadType): string => {
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

export const checkProtobufInput = async (
  proto: string,
  input: string,
  name: string,
  format?: PayloadType,
  ctx?: any,
) => {
  try {
    const root = protobuf.parse(proto).root
    const Message = root.lookupType(name)
    const content = JSON.parse(convertObject(input, format))
    const validationResult = Message.verify(content)
    if (validationResult) {
      ctx.$message.error('Message Test Error:：' + validationResult)
      return 'Message Test Error:：' + validationResult
    } else {
      return deserializeBufferToProtobuf(
        Buffer.from(Message.encode(Message.create(content)).finish()),
        proto,
        name,
        ctx,
      )
    }
  } catch (error) {
    ctx.$message.error('Message Eest Failed：' + error)
    return 'Message Eest Failed：' + error
  }
}

export const serializeProtobufToBuffer = (
  raw: string,
  proto: string | undefined,
  protobufMessageName: string | undefined,
  format?: PayloadType,
  ctx?: any,
): Buffer => {
  let rawData: string = ''
  try {
    rawData = convertObject(raw, format)
  } catch (error) {
    ctx.$message.error(`Message format type error : ${(error as Error).message.split('\n')[0]}`)
  }

  let bufferMessage = Buffer.from(rawData)
  if (proto && protobufMessageName) {
    try {
      const root = protobuf.parse(proto).root
      const Message = root.lookupType(protobufMessageName)
      const err = Message.verify(JSON.parse(rawData))
      if (err) {
        ctx.$message.error(`Message serialization error: ${err}`)
      }
      const data = Message.create(JSON.parse(rawData))
      const serializedMessage = Message.encode(data).finish()
      bufferMessage = Buffer.from(serializedMessage)
    } catch (error) {
      ctx.$message.error(`Message serialization error: ${(error as Error).message.split('\n')[0]}`)
    }
  }
  return bufferMessage
}

export const deserializeBufferToProtobuf = (
  payload: Buffer,
  proto: string | undefined,
  protobufMessageName: string | undefined,
  to?: PayloadType,
  ctx?: any,
): any => {
  if (proto && protobufMessageName) {
    try {
      const root = protobuf.parse(proto).root
      const Message = root.lookupType(protobufMessageName)
      const MessageData = Message.decode(Buffer.from(payload))
      const err = Message.verify(MessageData)
      if (err) {
        ctx.$message.error(`Message deserialization error: ${err}`)
      }
      if (to) {
        return Buffer.from(JSON.stringify(MessageData.toJSON()))
      }
      // return MessageData
      return protobufMessageName + ' ' + printObjectAsString(MessageData)
    } catch (error) {
      let err = transformPBJSError(error as Error)
      ctx.$message.error(err.message.split('\n')[0])
    }
  }
}
