import type { ScriptSchema } from 'mqttx'
import type { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'

export type RxScriptSchemaDocumentType = ScriptSchema

// ORM methods
interface RxScriptSchemaDocMethods {
  // hpPercent: () => number
}

export type RxScriptSchemaDocument = RxDocument<RxScriptSchemaDocumentType, RxScriptSchemaDocMethods>

export type RxScriptSchemaCollection = RxCollection<RxScriptSchemaDocumentType, RxScriptSchemaDocMethods>

const scriptSchemaSchema: RxJsonSchema<RxScriptSchemaDocumentType> = {
  title: 'script schema schema',
  description: 'describes the script schema',
  version: 0,
  keyCompression: false,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100, // <- the primary key must have set maxLength
    },
    codec: {
      type: 'string',
      enum: ['protobuf', 'avro'],
    },
    name: {
      type: 'string',
    },
    content: {
      type: 'string',
    },
  },
  required: ['id', 'codec', 'name', 'content'],
}

export default scriptSchemaSchema
