import * as avro from 'avsc'
import * as fs from 'fs'
import logWrapper from './logWrapper'

const schemaCache: { [key: string]: avro.Type } = {}

export const clearCache = (): void => {
  Object.keys(schemaCache).forEach((key) => delete schemaCache[key])
}

export const getAvroType = (schemaPath: string): avro.Type => {
  // first search from cache
  if (schemaCache[schemaPath]) {
    return schemaCache[schemaPath]
  }

  try {
    const schemaStr = fs.readFileSync(schemaPath, 'utf-8')
    let parsedSchema

    try {
      parsedSchema = JSON.parse(schemaStr)
    } catch (err: unknown) {
      logWrapper.fail(`Schema not following JSON format: ${(err as Error).message}`)
      process.exit(1)
    }

    const type = avro.Type.forSchema(parsedSchema)

    // cache the parsed schema
    schemaCache[schemaPath] = type

    return type
  } catch (err: unknown) {
    logWrapper.fail(`Unable to load avro schema from ${schemaPath}: ${(err as Error).message}`)
    process.exit(1)
  }
}

export const serializeAvroToBuffer = (raw: string | Buffer, avroSchemaPath: string): Buffer => {
  const type: avro.Type = getAvroType(avroSchemaPath)

  let rawMessage = raw.toString('utf-8')
  let parsedMessage

  // Avro requires structured message as input
  try {
    parsedMessage = JSON.parse(rawMessage)
  } catch (err: unknown) {
    logWrapper.fail(`Invalid JSON input: ${(err as Error).message}`)
    process.exit(1)
  }

  try {
    const serializedMessage = type.toBuffer(parsedMessage)
    return Buffer.from(serializedMessage)
  } catch (err: unknown) {
    logWrapper.fail(`Unable to serialize message to avro buffer: ${err}`)
    process.exit(1)
  }
}

export const deserializeBufferToAvro = (
  payload: Buffer,
  avscSchemaPath: string,
  needFormat: boolean,
): string | Buffer => {
  const type: avro.Type = getAvroType(avscSchemaPath)

  try {
    const message = type.fromBuffer(payload)

    if (needFormat) {
      return Buffer.from(JSON.stringify(message))
    }
    return JSON.stringify(message)
  } catch (err: unknown) {
    logWrapper.fail(`Unable to deserialize avro encoded buffer: ${(err as Error).message}`)
    process.exit(1)
  }
}
