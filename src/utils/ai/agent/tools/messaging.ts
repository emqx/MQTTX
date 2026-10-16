import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { matchTopicMethod } from '@/utils/topicMatch'
import { getMessageId } from '@/utils/idGenerator'
import type { ConnectionView } from '../connectionBridge'
import { AgentToolDeps } from './types'
import { now, truncatePayload, withTimeout } from './helpers'

const QoS = z.union([z.literal(0), z.literal(1), z.literal(2)])
const SUBSCRIBE_TIMEOUT = 15000
const PAYLOAD_TYPES = ['Plaintext', 'JSON', 'Base64', 'Hex'] as const

interface ReceivedMessage {
  topic: string
  payload: string
  qos: QoS
  retain: boolean
  direction: 'received'
  createAt: string
  encoding?: 'base64'
}

/** A disconnected connection only saves the subscription or drops the message, so the tools require a connection */
const assertConnected = (view: ConnectionView): void => {
  if (!view.getClient().connected) {
    throw new Error(`Connection "${view.record.name}" is not connected. Call connect first.`)
  }
}

/** Decodes an inbound payload, falling back to base64 when it is not valid UTF-8 */
const decodePayload = (buffer: Buffer | string): Pick<ReceivedMessage, 'payload' | 'encoding'> => {
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(buffer))
  try {
    return { payload: new TextDecoder('utf-8', { fatal: true }).decode(data) }
  } catch {
    return { payload: data.toString('base64'), encoding: 'base64' }
  }
}

export const createMessagingTools = (deps: AgentToolDeps): ToolSet => ({
  subscribe: tool({
    title: 'Subscribe',
    description: 'Subscribe a connected connection to a topic. nl, rap and rh only apply to MQTT 5.0 connections.',
    inputSchema: z.object({
      connectionId: z.string(),
      topic: z.string(),
      qos: QoS.optional().describe('Default 0'),
      nl: z.boolean().optional().describe('No local, MQTT 5.0 only'),
      rap: z.boolean().optional().describe('Retain as published, MQTT 5.0 only'),
      rh: QoS.optional().describe('Retain handling, MQTT 5.0 only'),
    }),
    execute: async ({ connectionId, topic, qos, nl, rap, rh }) => {
      const view = await deps.bridge.open(connectionId)
      assertConnected(view)
      await withTimeout(
        view.subscribe({ topic, qos: qos ?? 0, nl, rap, rh, disabled: false, createAt: now() }),
        SUBSCRIBE_TIMEOUT,
        `The broker did not answer the subscription to ${topic} within ${SUBSCRIBE_TIMEOUT / 1000}s`,
      )
      if (!(view.record.subscriptions ?? []).some((sub) => sub.topic === topic)) {
        throw new Error(`The broker rejected the subscription to ${topic}`)
      }
      return { subscribed: true, topic, qos: qos ?? 0 }
    },
  }),

  unsubscribe: tool({
    title: 'Unsubscribe',
    description: 'Remove a subscription from a connection.',
    inputSchema: z.object({ connectionId: z.string(), topic: z.string() }),
    execute: async ({ connectionId, topic }) => {
      const view = await deps.bridge.open(connectionId)
      if (!(view.record.subscriptions ?? []).some((sub) => sub.topic === topic)) {
        throw new Error(`Connection "${view.record.name}" is not subscribed to ${topic}`)
      }
      const removed = await view.unsubscribe(topic)
      if (!removed) throw new Error(`The subscription to ${topic} could not be removed`)
      return { unsubscribed: true }
    },
  }),

  publish: tool({
    title: 'Publish',
    description:
      'Publish a message to a topic on a connected connection. payloadType selects how the payload string is encoded.',
    inputSchema: z.object({
      connectionId: z.string(),
      topic: z.string(),
      payload: z.string(),
      qos: QoS.optional().describe('Default 0'),
      retain: z.boolean().optional().describe('Default false'),
      payloadType: z.enum(PAYLOAD_TYPES).optional().describe('Default Plaintext'),
    }),
    execute: async ({ connectionId, topic, payload, qos, retain, payloadType }) => {
      const view = await deps.bridge.open(connectionId)
      assertConnected(view)
      await view.publish(
        {
          id: getMessageId(),
          createAt: now(),
          out: true,
          topic,
          payload,
          qos: qos ?? 0,
          retain: retain ?? false,
          properties: {},
        } as MessageModel,
        payloadType ?? 'Plaintext',
      )
      return { published: true, topic, qos: qos ?? 0 }
    },
  }),

  get_messages: tool({
    title: 'Read messages',
    description:
      'Read stored messages of a connection, newest last. Incoming messages are saved once per second and only ' +
      'while the connection is open in MQTTX. The topic may contain MQTT wildcards.',
    inputSchema: z.object({
      connectionId: z.string(),
      topic: z.string().optional().describe('Topic filter, supports + and #'),
      direction: z.enum(['all', 'received', 'published']).optional().describe('Default all'),
      limit: z.number().int().min(1).max(50).optional().describe('Default 20'),
    }),
    execute: async ({ connectionId, topic, direction, limit }) => {
      const msgType: MessageType = direction === 'published' ? 'publish' : direction === 'received' ? 'received' : 'all'
      const result = await deps.services.messageService.get(connectionId, {
        limit: limit ?? 20,
        msgType,
        topic,
      })
      return {
        total: result.total,
        messages: result.list.map((message) => ({
          topic: message.topic,
          ...truncatePayload(message.payload),
          qos: message.qos,
          retain: message.retain,
          direction: message.out ? 'published' : 'received',
          createAt: message.createAt,
        })),
      }
    },
  }),

  wait_for_messages: tool({
    title: 'Wait for messages',
    description:
      'Wait for incoming messages on a connected connection. Returns as soon as count messages arrived or after ' +
      'timeoutSeconds. The connection must already be open in MQTTX (call connect or open_connection first).',
    inputSchema: z.object({
      connectionId: z.string(),
      topic: z.string().optional().describe('Topic filter, supports + and #'),
      count: z.number().int().min(1).max(20).optional().describe('Default 1'),
      timeoutSeconds: z.number().int().min(1).max(120).optional().describe('Default 15'),
    }),
    // The listener must be attached synchronously so a publish in the same step is not missed
    execute: (input, options) => {
      const view = deps.bridge.current()
      if (!view || view.connectionId !== input.connectionId) {
        throw new Error(`Connection ${input.connectionId} is not open in MQTTX. Call connect or open_connection first.`)
      }
      const client = view.getClient()
      if (!client.connected || !client.on || !client.removeListener) {
        throw new Error(`Connection "${view.record.name}" is not connected. Call connect first.`)
      }

      const count = input.count ?? 1
      const timeoutMs = (input.timeoutSeconds ?? 15) * 1000
      const messages: ReceivedMessage[] = []

      return new Promise<{ messages: ReceivedMessage[]; timedOut: boolean }>((resolve) => {
        const finish = (timedOut: boolean) => {
          client.removeListener?.('message', handler)
          clearTimeout(timer)
          options.abortSignal?.removeEventListener?.('abort', onAbort)
          resolve({ messages, timedOut })
        }
        const handler = (topic: string, payload: Buffer, packet?: { qos?: number; retain?: boolean }) => {
          if (input.topic && !matchTopicMethod(input.topic, topic)) return
          messages.push({
            topic,
            ...decodePayload(payload),
            qos: (packet?.qos ?? 0) as QoS,
            retain: packet?.retain ?? false,
            direction: 'received',
            createAt: now(),
          })
          if (messages.length >= count) finish(false)
        }
        const onAbort = () => finish(false)
        const timer = setTimeout(() => finish(true), timeoutMs)

        client.on!('message', handler)
        if (options.abortSignal?.aborted) {
          finish(false)
          return
        }
        options.abortSignal?.addEventListener?.('abort', onAbort)
      })
    },
  }),
})
