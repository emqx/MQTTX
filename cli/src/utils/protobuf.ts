import protobuf from 'protobufjs'

export const serializeProtobufToBuffer = (
  raw: string | Buffer,
  protobufPath: string | undefined,
  protobufMessageName: string | undefined,
): Buffer => {
  let bufferMessage = Buffer.from(raw)
  if (protobufPath && protobufMessageName) {
    try {
      const root = protobuf.loadSync(protobufPath)
      const Message = root.lookupType(protobufMessageName)
      const data = Message.create(JSON.parse(raw.toString()))
      const serializedMessage = Message.encode(data).finish()
      bufferMessage = Buffer.from(serializedMessage)
    } catch (err) {
      console.log(err)
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
    const root = protobuf.loadSync(protobufPath)
    const Message = root.lookupType(protobufMessageName)
    const MessageData = Message.decode(payload)
    if (to) {
      return Buffer.from(JSON.stringify(MessageData.toJSON()))
    }
    return MessageData
  }
}
