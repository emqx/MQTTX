import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { getCollectionId } from '@/utils/idGenerator'
import { AgentToolDeps } from './types'
import { emitAgentDataChanged } from '../agentEvents'

interface GroupInfo {
  id: string
  name: string
  parentId: string | null
  orderId?: number
}

const countConnections = (nodes: ConnectionModelTree[]): number =>
  nodes.reduce((sum, node) => sum + (node.isCollection ? countConnections(node.children ?? []) : 1), 0)

const walkCollections = (
  nodes: ConnectionModelTree[],
  parentId: string | null,
  visit: (group: GroupInfo, node: CollectionModel) => void,
): void => {
  for (const node of nodes) {
    if (!node.isCollection) continue
    visit({ id: node.id, name: node.name, parentId, orderId: node.orderId }, node)
    walkCollections(node.children ?? [], node.id, visit)
  }
}

/** A group and its tree node, which is needed to count the connections it and its sub-groups hold */
const findGroupNode = (
  nodes: ConnectionModelTree[],
  id: string,
): { group: GroupInfo; node: CollectionModel } | null => {
  let found: { group: GroupInfo; node: CollectionModel } | null = null
  walkCollections(nodes, null, (group, node) => {
    if (group.id === id) found = { group, node }
  })
  return found
}

export const findGroup = (nodes: ConnectionModelTree[], id: string): GroupInfo | null =>
  findGroupNode(nodes, id)?.group ?? null

/** Tools for the connection groups shown in the connection list */
export const createGroupTools = (deps: AgentToolDeps): ToolSet => ({
  list_groups: tool({
    title: 'List groups',
    description:
      'List the connection groups as a flat list with id, name, parent id and how many connections they hold.',
    inputSchema: z.object({}),
    execute: async () => {
      const all = (await deps.services.collectionService.getAll()) ?? []
      const groups: Array<GroupInfo & { connectionCount: number }> = []
      walkCollections(all, null, (group, node) => {
        groups.push({ ...group, connectionCount: countConnections(node.children ?? []) })
      })
      return { groups }
    },
  }),

  save_group: tool({
    title: 'Save group',
    description: 'Create a connection group (optionally inside another group with parentId), or rename one by id.',
    inputSchema: z.object({
      id: z.string().optional().describe('Rename this group; omit to create a new one'),
      name: z.string().describe('Group name'),
      parentId: z.string().optional().describe('Parent group id; omit for a top level group'),
    }),
    execute: async ({ id, name, parentId }) => {
      const all = (await deps.services.collectionService.getAll()) ?? []
      if (id) {
        const group = findGroup(all, id)
        if (!group) throw new Error(`Group ${id} not found`)
        await deps.services.collectionService.update(
          { id, name, orderId: group.orderId, isCollection: true, children: [] },
          group.parentId ?? undefined,
        )
        emitAgentDataChanged('connections')
        return { id, name }
      }
      if (parentId && !findGroup(all, parentId)) {
        throw new Error(`Parent group ${parentId} not found`)
      }
      const created = await deps.services.collectionService.add(
        { id: getCollectionId(), name, isCollection: true, children: [] },
        parentId,
      )
      if (!created?.id) throw new Error('The group could not be created')
      emitAgentDataChanged('connections')
      return { id: created.id, name: created.name }
    },
  }),

  delete_group: tool({
    title: 'Delete group',
    description:
      'Delete a connection group. Only an empty group can be deleted: if the group or a sub-group still holds ' +
      'connections, move or delete them first. Empty sub-groups are removed together with it.',
    inputSchema: z.object({ groupId: z.string().describe('Group id from list_groups') }),
    execute: async ({ groupId }) => {
      const all = (await deps.services.collectionService.getAll()) ?? []
      const target = findGroupNode(all, groupId)
      if (!target) throw new Error(`Group ${groupId} not found`)
      const connections = countConnections(target.node.children ?? [])
      if (connections > 0) {
        throw new Error(
          `Group "${target.group.name}" still holds ${connections} connection(s). Move or delete them before deleting the group.`,
        )
      }
      await deps.services.collectionService.delete(groupId)
      emitAgentDataChanged('connections')
      return { deleted: true, name: target.group.name }
    },
  }),
})
