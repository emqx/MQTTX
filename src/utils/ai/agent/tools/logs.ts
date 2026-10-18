import fs from 'fs'
import path from 'path'
import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { getOrCreateLogDir } from '@/utils/logger'

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const
type LogLevelName = keyof typeof LEVELS
const MAX_LINES = 500

/** The value after a secret key: "password": "x", token=x */
const SECRET_VALUE = /((?:password|passwd|token|secret|api[_-]?key)["']?\s*[:=]\s*)(["']?)([^"'\s,;}]*)/gi

/** Authorization carries a scheme and a token, so everything after it is redacted */
const AUTH_VALUE = /(authorization["']?\s*[:=]\s*)([^\r\n]*)/gi

/** Replaces the value that follows a secret key with *** */
export const redactLogLine = (line: string): string =>
  line
    .replace(AUTH_VALUE, (_match, prefix: string) => `${prefix}***`)
    .replace(SECRET_VALUE, (_match, prefix: string, quote: string) => `${prefix}${quote}***`)

const lineLevel = (line: string): LogLevelName | null => {
  const match = line.match(/\[(DEBUG|INFO|WARN|ERROR)\]/i)
  return match ? (match[1].toLowerCase() as LogLevelName) : null
}

/**
 * Log tool. The log file may contain secrets typed by the user, so every line is redacted before it
 * is returned to the model.
 */
export const createLogTools = (): ToolSet => ({
  read_logs: tool({
    title: 'Read logs',
    description:
      'Read the last lines of the MQTTX log file (newest last). Useful to diagnose connection failures, disconnects or message delivery problems. ' +
      'Values after password, token, secret, apiKey and Authorization are replaced with ***.',
    inputSchema: z.object({
      lines: z.number().int().min(1).max(MAX_LINES).optional().describe('How many lines from the end, default 100'),
      level: z.enum(['debug', 'info', 'warn', 'error']).optional().describe('Only this level and above'),
      contains: z.string().optional().describe('Only lines containing this text'),
    }),
    execute: async ({ lines, level, contains }) => {
      const logPath = path.join(getOrCreateLogDir(), 'log')
      if (!fs.existsSync(logPath)) return { lines: [], total: 0, truncated: false }
      let all = fs
        .readFileSync(logPath, 'utf8')
        .split('\n')
        .filter((line) => line !== '')
      if (level) {
        const minimum = LEVELS[level]
        all = all.filter((line) => {
          const current = lineLevel(line)
          return current === null ? true : LEVELS[current] >= minimum
        })
      }
      if (contains) all = all.filter((line) => line.includes(contains))
      const selected = all.slice(-(lines ?? 100)).map(redactLogLine)
      return { lines: selected, total: all.length, truncated: all.length > selected.length }
    },
  }),
})
