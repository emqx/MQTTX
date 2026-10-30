import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import {
  MAX_MAX_PAYLOAD_DISPLAY_SIZE,
  MIN_MAX_PAYLOAD_DISPLAY_SIZE,
  normalizeMaxPayloadDisplaySize,
} from '@/utils/data'
import { applyLangChange, applyThemeChange, themeFromOs } from '@/utils/settingsEffects'
import { AgentToolDeps } from './types'

type SettingKey =
  | 'currentTheme'
  | 'currentLang'
  | 'syncOsTheme'
  | 'autoCheck'
  | 'autoResub'
  | 'multiTopics'
  | 'jsonHighlight'
  | 'maxReconnectTimes'
  | 'ignoreQoS0Message'
  | 'topicWhitespaceDetection'
  | 'maxPayloadDisplaySize'

/** Settings the agent may change; each maps to the same store action the Settings page uses */
const WRITABLE: Record<SettingKey, string> = {
  currentTheme: 'TOGGLE_THEME',
  currentLang: 'TOGGLE_LANG',
  syncOsTheme: 'TOGGLE_SYNC_OS_THEME',
  autoCheck: 'TOGGLE_AUTO_CHECK',
  autoResub: 'TOGGLE_AUTO_RESUB',
  multiTopics: 'TOGGLE_MULTI_TOPICS',
  jsonHighlight: 'TOGGLE_JSON_HIGHLIGHT',
  maxReconnectTimes: 'SET_MAX_RECONNECT_TIMES',
  ignoreQoS0Message: 'TOGGLE_IGNORE_QOS0_MESSAGE',
  topicWhitespaceDetection: 'TOGGLE_TOPIC_WHITESPACE_DETECTION',
  maxPayloadDisplaySize: 'SET_MAX_PAYLOAD_DISPLAY_SIZE',
}

/**
 * Readable but deliberately not writable: the agent must not change its own reasoning, limits or the
 * running model, enableHardwareAcceleration needs an app restart, and debug logging exposes packets
 */
const READ_ONLY = [
  'agentReasoning',
  'agentPermissionMode',
  'agentMaxSteps',
  'model',
  'enableHardwareAcceleration',
  'logLevel',
] as const

/** The language, theme and syncOsTheme keys are applied by their own side effects below */
const SPECIAL_KEYS: SettingKey[] = ['currentLang', 'currentTheme', 'syncOsTheme']

/** Boolean/number settings applied with a plain dispatch, in the order of `WRITABLE` */
const PLAIN_KEYS: SettingKey[] = (Object.keys(WRITABLE) as SettingKey[]).filter((key) => !SPECIAL_KEYS.includes(key))

const updateSchema = z
  .object({
    currentTheme: z.enum(['light', 'dark', 'night']).optional().describe('Application theme'),
    currentLang: z.enum(['zh', 'en', 'ja', 'tr', 'hu', 'ko']).optional().describe('Interface language'),
    syncOsTheme: z.boolean().optional().describe('Follow the operating system theme'),
    autoCheck: z.boolean().optional().describe('Check for updates automatically'),
    autoResub: z.boolean().optional().describe('Re-subscribe automatically on reconnect'),
    multiTopics: z.boolean().optional().describe('Allow several comma separated topics'),
    jsonHighlight: z.boolean().optional().describe('Highlight JSON payloads'),
    maxReconnectTimes: z.number().int().min(1).optional().describe('Maximum reconnection attempts, at least 1'),
    ignoreQoS0Message: z.boolean().optional().describe('Do not store QoS 0 messages'),
    topicWhitespaceDetection: z.boolean().optional().describe('Detect whitespace in topics'),
    maxPayloadDisplaySize: z
      .number()
      .int()
      .min(MIN_MAX_PAYLOAD_DISPLAY_SIZE)
      .max(MAX_MAX_PAYLOAD_DISPLAY_SIZE)
      .optional()
      .describe('Bytes shown per payload before truncation (16 KB to 2 MB)'),
  })
  .strict()

const WRITABLE_NAMES = Object.keys(WRITABLE).join(', ')

/** Reads and writes the whitelisted MQTTX settings through the same actions and effects as the Settings page */
export const createSettingsTools = (deps: AgentToolDeps): ToolSet => ({
  get_settings: tool({
    title: 'Read settings',
    description:
      `Read the MQTTX settings. Readable: ${WRITABLE_NAMES}. ` +
      `Also read-only: ${READ_ONLY.join(', ')}. ` +
      'The API key and host and the enableAgent switch are never returned.',
    inputSchema: z.object({}),
    execute: async () => {
      const getters = deps.store.getters
      const settings: Record<string, unknown> = {}
      for (const key of [...(Object.keys(WRITABLE) as SettingKey[]), ...READ_ONLY]) settings[key] = getters[key]
      return settings
    },
  }),

  update_settings: tool({
    title: 'Update settings',
    description:
      `Change MQTTX settings. Writable: ${WRITABLE_NAMES}. ` +
      'Cannot be changed: model, agentReasoning, agentPermissionMode and agentMaxSteps (they affect the running ' +
      'reply or the agent itself) and enableHardwareAcceleration (needs an app restart); ' +
      'the API key, the API host and enableAgent are never touched. Unknown keys are rejected. ' +
      'When the user asks for one of these, ask them to change it on the Settings page.',
    inputSchema: updateSchema,
    execute: async (input) => {
      // Validate here too: the model-facing SDK validates, but calling the tool directly must reject
      // unknown or out-of-range keys before anything is written
      const data = updateSchema.parse(input)
      const updated: Record<string, unknown> = {}
      const apply = async (key: SettingKey, value: unknown): Promise<void> => {
        const finalValue = key === 'maxPayloadDisplaySize' ? normalizeMaxPayloadDisplaySize(value as number) : value
        await deps.store.dispatch(WRITABLE[key], { [key]: finalValue })
        updated[key] = finalValue
      }

      if (data.currentLang !== undefined) {
        await apply('currentLang', data.currentLang)
        applyLangChange(data.currentLang)
      }
      // Switching "follow the system theme" on also applies the current OS theme, like the Settings page
      if (data.syncOsTheme !== undefined) {
        if (data.syncOsTheme) {
          const theme = themeFromOs()
          await apply('currentTheme', theme)
          applyThemeChange(theme)
        }
        await apply('syncOsTheme', data.syncOsTheme)
      }
      if (data.currentTheme !== undefined) {
        await apply('currentTheme', data.currentTheme)
        applyThemeChange(data.currentTheme)
      }
      for (const key of PLAIN_KEYS) {
        const value = (data as Record<string, unknown>)[key]
        if (value !== undefined) await apply(key, value)
      }

      return { updated }
    },
  }),
})
