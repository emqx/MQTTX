// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'
import avro from 'avsc'
import { decode as cborDecode, encode as cborEncode } from 'cbor2'
import { unpack as msgpackDecode, pack as msgpackEncode } from 'msgpackr'
import protobuf from 'protobufjs'

function encodeCbor(args: { payload: Buffer }): Buffer {
  return Buffer.from(cborEncode(JSON.parse(args.payload.toString())))
}

function decodeCbor(args: { payload: Buffer }): Buffer {
  const decoded = cborDecode(args.payload)
  return Buffer.from(JSON.stringify(decoded))
}

function encodeMsgPack(args: { payload: Buffer }): Buffer {
  return msgpackEncode(JSON.parse(args.payload.toString()))
}

function decodeMsgPack(args: { payload: Buffer }): Buffer {
  const decoded = msgpackDecode(args.payload)
  return Buffer.from(JSON.stringify(decoded))
}

function getProtobufMessage(schema: string, messageName: string) {
  const root = protobuf.parse(schema, { keepCase: true }).root
  return root.lookupType(messageName)
}

function encodeProtobuf(args: {
  payload: Buffer
  schema: string
  messageName: string
}): Buffer {
  const Message = getProtobufMessage(args.schema, args.messageName)
  // Avoid using json-bigint for parsing as it will lose the prototype, causing verification to fail
  // Issue: https://github.com/sidorares/json-bigint/issues/38
  const payloadObj = JSON.parse(args.payload.toString())
  const err = Message.verify(payloadObj)
  if (err) throw err
  const data = Message.create(payloadObj)
  const serializedMessage = Message.encode(data).finish()
  return Buffer.from(serializedMessage)
}

function decodeProtobuf(args: {
  payload: Buffer
  schema: string
  messageName: string
}): Buffer {
  const Message = getProtobufMessage(args.schema, args.messageName)
  const MessageData = Message.decode(args.payload)
  const err = Message.verify(MessageData)
  if (err) throw err
  return Buffer.from(JSON.stringify(MessageData))
}

function encodeAvro(args: {
  payload: Buffer
  schema: string
}): Buffer {
  const AvroType = avro.Type.forSchema(JSON.parse(args.schema))
  const payloadObj = JSON.parse(args.payload.toString())
  return AvroType.toBuffer(payloadObj)
}

function decodeAvro(args: {
  payload: Buffer
  schema: string
}): Buffer {
  const AvroType = avro.Type.forSchema(JSON.parse(args.schema))
  const decoded = AvroType.fromBuffer(args.payload)
  return Buffer.from(JSON.stringify(decoded))
}

export const payloadCodec = {
  cbor: {
    encode: encodeCbor,
    decode: decodeCbor,
  },
  msgpack: {
    encode: encodeMsgPack,
    decode: decodeMsgPack,
  },
  protobuf: {
    encode: encodeProtobuf,
    decode: decodeProtobuf,
  },
  avro: {
    encode: encodeAvro,
    decode: decodeAvro,
  },
}
