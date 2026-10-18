import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { buildTopicTreeFromStats } from '@/utils/topicTree'
import { AgentToolDeps } from './types'
import { emitAgentDataChanged } from '../agentEvents'

const MAX_NODES = 200
const LAST_PAYLOAD_LIMIT = 200

interface CompactTopicNode {
  topic: string
  messageCount: number
  subTopicCount: number
  lastPayload?: string
  children: CompactTopicNode[]
}

const truncate = (value: string, limit: number): string => (value.length > limit ? value.slice(0, limit) : value)

const findNode = (root: TopicTreeNode, prefix: string): TopicTreeNode | null => {
  let node: TopicTreeNode | undefined = root
  for (const segment of prefix.split('/').filter(Boolean)) {
    node = node?.children?.find((child) => child.label === segment)
    if (!node) return null
  }
  return node ?? null
}

const serialize = (node: TopicTreeNode, depth: number, counter: { count: number }): CompactTopicNode | null => {
  if (counter.count >= MAX_NODES) return null
  counter.count += 1
  const compact: CompactTopicNode = {
    topic: node.label,
    messageCount: node.messageCount ?? 0,
    subTopicCount: node.subTopicCount ?? 0,
    children: [],
  }
  const payload = node.message?.payload
  if (typeof payload === 'string' && payload) compact.lastPayload = truncate(payload, LAST_PAYLOAD_LIMIT)
  if (depth > 1) {
    for (const child of node.children ?? []) {
      const childCompact = serialize(child, depth - 1, counter)
      if (!childCompact) break
      compact.children.push(childCompact)
    }
  }
  return compact
}

/**
 * Topic Tree tools. The tree is derived from stored messages, so syncing is read-only for user data;
 * clearing it removes the derived tree only.
 */
export const createTopicTreeTools = (deps: AgentToolDeps): ToolSet => ({
  sync_topic_tree: tool({
    title: 'Sync topic tree',
    description:
      'Rebuild the topic tree of one connection from its stored messages, like the Topic Tree page does. ' +
      'The tree is derived data, nothing is lost by syncing.',
    inputSchema: z.object({ connectionId: z.string().describe('Connection id from list_connections') }),
    execute: async ({ connectionId }) => {
      const { messageService, topicNodeService } = deps.services
      const stats = await messageService.getMessageTopicNodeStats(connectionId)
      if (!stats) throw new Error(`Connection ${connectionId} not found`)
      const tree = buildTopicTreeFromStats(stats.connection, stats.topicStats)
      await topicNodeService.updateTopicNodes(tree)
      emitAgentDataChanged('topic-tree')
      return {
        connection: tree.label,
        topics: stats.topicStats.length,
        messages: stats.topicStats.reduce((sum, stat) => sum + stat.msgCount, 0),
      }
    },
  }),

  get_topic_tree: tool({
    title: 'Read topic tree',
    description:
      'Read the stored topic tree as nested topics with message counts and the last payload. ' +
      'Narrow a large tree with prefix and depth; at most 200 nodes are returned.',
    inputSchema: z.object({
      connectionId: z.string().optional().describe('Only this connection'),
      prefix: z.string().optional().describe('Only the subtree under this topic prefix, for example a/b'),
      depth: z.number().int().min(1).max(8).optional().describe('Levels to return, default 3, max 8'),
    }),
    execute: async ({ connectionId, prefix, depth }) => {
      const roots = await deps.services.topicNodeService.getTree()
      const selected = connectionId
        ? roots.filter((root) => root.connectionInfo?.id === connectionId || root.id === connectionId)
        : roots
      const counter = { count: 0 }
      const limit = depth ?? 3
      const topics: CompactTopicNode[] = []
      for (const root of selected) {
        if (prefix) {
          const node = findNode(root, prefix)
          if (!node) continue
          const compact = serialize({ ...node, label: prefix }, limit, counter)
          if (compact) topics.push(compact)
        } else {
          for (const child of root.children ?? []) {
            const compact = serialize(child, limit, counter)
            if (!compact) break
            topics.push(compact)
          }
        }
        if (counter.count >= MAX_NODES) break
      }
      const truncated = counter.count >= MAX_NODES
      return {
        topics,
        truncated,
        ...(truncated ? { hint: 'More topics were found. Use prefix to narrow the range.' } : {}),
      }
    },
  }),

  clear_topic_tree: tool({
    title: 'Clear topic tree',
    description: 'Delete the whole stored topic tree, like the Topic Tree page "Clear" action.',
    inputSchema: z.object({}),
    execute: async () => {
      await deps.services.topicNodeService.clearTree()
      emitAgentDataChanged('topic-tree')
      return { cleared: true }
    },
  }),
})
