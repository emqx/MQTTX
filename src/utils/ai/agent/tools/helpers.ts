import fs from 'fs'
import path from 'path'
import time from '@/utils/time'

export const MASKED = '***'
export const PAYLOAD_LIMIT = 2000

/** Throws a clear error unless the path is an absolute, existing, readable regular file */
export const assertReadableFile = (label: string, filePath: string): void => {
  if (!path.isAbsolute(filePath)) {
    throw new Error(`${label} must be an absolute path, got "${filePath}".`)
  }
  let stat: fs.Stats
  try {
    stat = fs.statSync(filePath)
  } catch {
    throw new Error(`${label} file not found: "${filePath}".`)
  }
  if (!stat.isFile()) {
    throw new Error(`${label} is not a regular file: "${filePath}".`)
  }
  try {
    fs.accessSync(filePath, fs.constants.R_OK)
  } catch {
    throw new Error(`${label} is not readable: "${filePath}".`)
  }
}

export const maskSecret = (value: string | null | undefined): string => (value ? MASKED : '')

/** Truncates a payload so a large message cannot flood the model context */
export const truncatePayload = (payload: string): { payload: string; truncated?: boolean } =>
  payload.length > PAYLOAD_LIMIT ? { payload: payload.slice(0, PAYLOAD_LIMIT), truncated: true } : { payload }

/** Removes secrets from a connection record before it is returned to the model */
export const sanitizeConnection = (record: ConnectionModel, connected: boolean) => ({
  id: record.id,
  name: record.name,
  host: record.host,
  port: record.port,
  protocol: record.protocol,
  path: record.path,
  clientId: record.clientId,
  username: record.username,
  password: maskSecret(record.password),
  mqttVersion: record.mqttVersion,
  clean: record.clean,
  keepalive: record.keepalive,
  ssl: record.ssl,
  certType: record.certType ?? '',
  rejectUnauthorized: record.rejectUnauthorized,
  // Certificate paths are returned as-is: the model needs them to update the connection
  ca: record.ca || '',
  cert: record.cert || '',
  key: record.key || '',
  ALPNProtocols: record.ALPNProtocols || '',
  connected,
  subscriptions: (record.subscriptions ?? []).map((sub) => ({
    topic: sub.topic,
    qos: sub.qos,
    disabled: sub.disabled,
  })),
  will: record.will
    ? {
        lastWillTopic: record.will.lastWillTopic,
        lastWillQos: record.will.lastWillQos,
        lastWillRetain: record.will.lastWillRetain,
        hasPayload: Boolean(record.will.lastWillPayload),
      }
    : null,
})

export const now = (): string => time.getNowDate()

/** Rejects with the message when the promise does not settle in time */
export const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
