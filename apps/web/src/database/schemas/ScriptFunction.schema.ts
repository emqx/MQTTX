import type { ScriptFunction } from 'mqttx'
import type { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'

export type RxScriptFunctionDocumentType = ScriptFunction

// ORM methods
interface RxScriptFunctionDocMethods {
  // hpPercent: () => number
}

export type RxScriptFunctionDocument = RxDocument<RxScriptFunctionDocumentType, RxScriptFunctionDocMethods>

export type RxScriptFunctionCollection = RxCollection<RxScriptFunctionDocumentType, RxScriptFunctionDocMethods>

const scriptFunctionSchema: RxJsonSchema<RxScriptFunctionDocumentType> = {
  title: 'script function schema',
  description: 'describes the script function',
  version: 0,
  keyCompression: false,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100, // <- the primary key must have set maxLength
    },
    lang: {
      type: 'string',
      enum: ['javascript'],
    },
    name: {
      type: 'string',
    },
    content: {
      type: 'string',
    },
  },
  required: ['id', 'lang', 'name', 'content'],
}

export default scriptFunctionSchema
