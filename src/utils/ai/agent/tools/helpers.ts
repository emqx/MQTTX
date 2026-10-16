import time from '@/utils/time'

export const MASKED = '***'
export const PAYLOAD_LIMIT = 2000

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
  rejectUnauthorized: record.rejectUnauthorized,
  ca: maskSecret(record.ca),
  cert: maskSecret(record.cert),
  key: maskSecret(record.key),
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
