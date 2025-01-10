import type { ScriptSchema } from 'mqttx'
// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'
import protobuf from 'protobufjs'

function getProtobufMessage(protoSchema: string, messageName: string) {
  const root = protobuf.parse(protoSchema).root
  return root.lookupType(messageName)
}

export const PayloadCodec: Record<ScriptSchema['codec'], Record<'encode' | 'decode', (args: any) => Buffer>> = {
  protobuf: {
    encode({
      payload,
      protoSchema,
      messageName,
    }: {
      payload: Buffer
      protoSchema: string
      messageName: string
    }): Buffer {
      const Message = getProtobufMessage(protoSchema, messageName)
      // Avoid using json-bigint for parsing as it will lose the prototype, causing verification to fail
      // Issue: https://github.com/sidorares/json-bigint/issues/38
      const payloadObj = JSON.parse(payload.toString())
      const err = Message.verify(payloadObj)
      if (err) throw err
      const data = Message.create(payloadObj)
      const serializedMessage = Message.encode(data).finish()
      return Buffer.from(serializedMessage)
    },

    decode({
      payload,
      protoSchema,
      messageName,
    }: {
      payload: Buffer
      protoSchema: string
      messageName: string
    }): Buffer {
      const Message = getProtobufMessage(protoSchema, messageName)
      const MessageData = Message.decode(payload)
      const err = Message.verify(MessageData)
      if (err) throw err
      return Buffer.from(JSON.stringify(MessageData))
    },
  },
  avro: {
    encode: () => Buffer.from(''),
    decode: () => Buffer.from(''),
  },
}
