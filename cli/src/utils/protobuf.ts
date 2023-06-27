import protobuf from 'protobufjs'

export const serializeProtobufToBuffer = (
  raw: string | Buffer,
  protobufPath: string | undefined,
  protobufMessageName: string | undefined,
): Buffer => {
  let bufferMessage = Buffer.from(raw)
  if (protobufPath && protobufMessageName) {
    const root = protobuf.loadSync(protobufPath)
    const MyMessage = root.lookupType(protobufMessageName)
    const data = MyMessage.create(JSON.parse(raw.toString()))
    const serializedMessage = MyMessage.encode(data).finish()
    bufferMessage = Buffer.from(serializedMessage)
  }
  return bufferMessage
}

export const deserializeBufferToProtobuf = (
  payload: Buffer,
  protobufPath: string | undefined,
  protobufMessageName: string | undefined,
): any => {
  if (protobufPath && protobufMessageName) {
    const root = protobuf.loadSync(protobufPath)
    const MyMessage = root.lookupType(protobufMessageName)
    return MyMessage.decode(payload)
  }
}
