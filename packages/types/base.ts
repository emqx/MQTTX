declare global {
  interface Window {
    __APP_VERSION__: string
    forceCheck?: boolean
  }
}

export type PlatformType = 'desktop' | 'web'

export type MQTTVersion = 3 | 4 | 5

export type Protocol = 'mqtt' | 'mqtts'

export type QoS = 0 | 1 | 2

export type Lang = 'en' | 'zh' | 'ja' | 'hu' | 'tr'

export type Theme = 'light' | 'dark' | 'night'

export interface Settings {
  // General
  currentLang: Lang
  autoCheck: boolean
  autoResub: boolean
  multiTopics: boolean
  maxReconnectTimes: number
  // Appearance
  syncOsTheme: boolean
  currentTheme: Theme
  jsonHighlight: boolean
  // Advanced
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  ignoreQoS0Message: boolean
  // MQTTX Copilot
  enableCopilot: boolean
  openAIAPIHost: string
  openAIAPIKey: string
  model: string
}

export interface ScriptFunction {
  id: string
  lang: 'javascript'
  name: string
  content: string
}

export default {}

export interface Connection {
  id: string
  name: string
}

export interface ConnectionDetail {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  lastConnected: string
  topics: string[]
}
