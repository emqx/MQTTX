import * as avro from 'avsc'
import { convertObject } from './schemaUtils'

export const parseSchema = (rawAvroSchema: string): avro.Type => {
  let parsedSchema

  try {
    parsedSchema = JSON.parse(rawAvroSchema)
  } catch (err) {
    throw new Error(`Schema not following JSON format: ${(err as Error).message}`)
  }

  return avro.Type.forSchema(parsedSchema)
}

export const checkAvroInput = (rawAvroSchema: string, input: string, format?: PayloadType): string => {
  try {
    const type: avro.Type = parseSchema(rawAvroSchema)

    type.isValid(JSON.parse(input), {
      errorHook: (path, value, type) => {
        throw new Error(
          `Message Test Error at path ${path.join('.')}: value ${JSON.stringify(value)} is not of type ${type}`,
        )
      },
    })

    const result = deserializeBufferToAvro(serializeAvroToBuffer(input, rawAvroSchema, format), rawAvroSchema, format)

    return result.toString()
  } catch (error) {
    throw new Error('Message Test Failed: ' + (error as Error).message)
  }
}

export const serializeAvroToBuffer = (raw: string, rawAvroSchema: string, format?: PayloadType): Buffer => {
  const type: avro.Type = parseSchema(rawAvroSchema)

  let rawMessage: string
  try {
    rawMessage = convertObject(raw, format)
  } catch (error) {
    throw new TypeError(`Message format type error: ${(error as Error).message.split('\n')[0]}`)
  }

  let parsedMessage

  try {
    parsedMessage = JSON.parse(rawMessage)
  } catch (err) {
    throw new SyntaxError(`Invalid JSON input: ${(err as Error).message}`)
  }

  try {
    const serializedMessage: Buffer = type.toBuffer(parsedMessage)
    return serializedMessage
  } catch (err) {
    throw new Error(`Message serialization error: ${(err as Error).message}`)
  }
}

export const deserializeBufferToAvro = (
  payload: Buffer,
  rawAvroSchema: string,
  needFormat?: PayloadType,
): Buffer | string => {
  const type: avro.Type = parseSchema(rawAvroSchema)

  try {
    const message = type.fromBuffer(payload)
    const parsedMessage = JSON.stringify(message)
    if (needFormat) {
      return Buffer.from(parsedMessage)
    }
    return parsedMessage
  } catch (err) {
    throw new Error(`Message deserialization error: ${(err as Error).message}`)
  }
}
