import type { Settings } from 'mqttx'
import type { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'

export type RxSettingsDocumentType = Settings & { id: string }

// ORM methods
interface RxSettingsDocMethods {
  // hpPercent: () => number
}

export type RxSettingsDocument = RxDocument<RxSettingsDocumentType, RxSettingsDocMethods>

export type RxSettingsCollection = RxCollection<RxSettingsDocumentType, RxSettingsDocMethods>

const settingsSchema: RxJsonSchema<RxSettingsDocumentType> = {
  title: 'settings schema',
  description: 'describes the settings',
  version: 0,
  keyCompression: false,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100, // <- the primary key must have set maxLength
    },
    currentLang: {
      type: 'string',
      default: 'en',
    },
    autoCheck: {
      type: 'boolean',
      default: true,
    },
    autoResub: {
      type: 'boolean',
      default: true,
    },
    multiTopics: {
      type: 'boolean',
      default: true,
    },
    maxReconnectTimes: {
      type: 'number',
      default: 10,
    },
    syncOsTheme: {
      type: 'boolean',
      default: false,
    },
    currentTheme: {
      type: 'string',
      default: 'light',
    },
    jsonHighlight: {
      type: 'boolean',
      default: true,
    },
    logLevel: {
      type: 'string',
      default: 'info',
    },
    ignoreQoS0Message: {
      type: 'boolean',
      default: false,
    },
    enableCopilot: {
      type: 'boolean',
      default: true,
    },
    openAIAPIHost: {
      type: 'string',
      default: 'https://api.openai.com/v1',
    },
    openAIAPIKey: {
      type: 'string',
      default: '',
    },
    model: {
      type: 'string',
      default: 'gpt-4o',
    },
  },
  required: ['id'],
}

export default settingsSchema
