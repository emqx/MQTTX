import { Buffer } from 'buffer'
import { IPublishPacket } from 'mqtt-packet/types'
import time from '@/utils/time'

/**
 * Updates the topic tree structure with new message data.
 *
 * Mutates `currentTree` in place and returns it as `updatedTree`.
 *
 * @param currentTree - The current state of the topic tree.
 * @param rawData - An object containing the MQTT packet and connection information.
 * @returns The updated tree, the updated nodes and `newNodeParentId`.
 */
export function updateTopicTreeNode(
  currentTree: TopicTreeNode[],
  rawData: {
    packet: IPublishPacket
    connectionInfo: ConnectionModel
  },
): {
  updatedTree: TopicTreeNode[]
  updatedNodes: TopicTreeNode[]
  newNodeParentId?: string
} {
  const { packet, connectionInfo } = rawData
  const { topic, payload, qos, retain, properties } = packet
  const payloadString = Buffer.from(payload).toString()
  const topicLevels = topic.split('/')
  const currentTime = time.getNowDate()
  const currentProperties = properties ?? {}

  let hostNode = currentTree.find((node) => node.id === connectionInfo.id)
  const updatedNodes: TopicTreeNode[] = []
  let isNewHost = false

  if (!hostNode) {
    hostNode = {
      id: connectionInfo.id ?? '',
      label: connectionInfo.host,
      message: undefined,
      messageCount: 0,
      subTopicCount: 0,
      connectionInfo,
      children: [],
    }
    currentTree.push(hostNode)
    isNewHost = true
  }

  const originalHostMessageCount = hostNode.messageCount
  const originalHostSubTopicCount = hostNode.subTopicCount

  hostNode.messageCount++

  // Nodes on the topic path, host first, leaf last.
  const pathNodes: TopicTreeNode[] = [hostNode]
  let newNodeCount = 0
  let newNodeParentId: string | undefined

  let currentNode = hostNode
  let currentId = connectionInfo.id

  for (let i = 0; i < topicLevels.length; i++) {
    const level = topicLevels[i]
    const childIndex = currentNode.children?.findIndex((n) => n.label === level) ?? -1
    let childNode: TopicTreeNode
    let isNewNode = false

    if (childIndex === -1) {
      currentId = `${currentId}_${currentNode.children?.length ?? 0 + 1}`
      childNode = {
        id: currentId,
        label: level,
        message: undefined,
        messageCount: 0,
        subTopicCount: 0,
        children: [],
        parentId: currentNode.id,
      }
      if (currentNode.children) {
        currentNode.children.push(childNode)
      } else {
        currentNode.children = [childNode]
      }
      isNewNode = true
      newNodeCount++
      // First new node's parent is the only node el-tree must sync.
      if (newNodeParentId === undefined && !isNewHost) {
        newNodeParentId = currentNode.id
      }
    } else {
      childNode = currentNode.children![childIndex]
      currentId = childNode.id
    }

    const originalChildMessageCount = childNode.messageCount
    const originalChildSubTopicCount = childNode.subTopicCount

    childNode.messageCount++

    if (i === topicLevels.length - 1) {
      childNode.message = {
        payload: payloadString,
        qos,
        retain,
        createAt: currentTime,
        out: false,
        topic,
        properties: currentProperties,
      }
    }

    if (
      isNewNode ||
      childNode.messageCount !== originalChildMessageCount ||
      childNode.subTopicCount !== originalChildSubTopicCount
    ) {
      updatedNodes.push(childNode)
    }

    pathNodes.push(childNode)
    currentNode = childNode
  }

  // Each path node gains the nodes newly created below it.
  if (newNodeCount > 0) {
    const firstNewNodeIndex = pathNodes.length - newNodeCount
    for (let i = 0; i < pathNodes.length; i++) {
      const newNodesBelow = i < firstNewNodeIndex ? newNodeCount : pathNodes.length - 1 - i
      pathNodes[i].subTopicCount += newNodesBelow
    }
  }

  if (
    isNewHost ||
    hostNode.messageCount !== originalHostMessageCount ||
    hostNode.subTopicCount !== originalHostSubTopicCount
  ) {
    updatedNodes.push(hostNode)
  }

  // Updated nodes are now flattened data; including children here would be redundant
  const simplifiedUpdatedNodes = updatedNodes.map((node) => ({
    id: node.id,
    label: node.label,
    message: node.message,
    messageCount: node.messageCount,
    subTopicCount: node.subTopicCount,
    parentId: node.parentId,
    connectionInfo: node.connectionInfo,
  }))

  return { updatedTree: currentTree, updatedNodes: simplifiedUpdatedNodes, newNodeParentId }
}

/**
 * Recursively updates the subTopicCount for each node in the topic tree.
 *
 * @param node - The current node in the topic tree to update.
 * @returns The total number of subtopics for the current node and its children.
 */
export function updateSubTopicCounts(node: TopicTreeNode): number {
  if (!node.children || node.children.length === 0) {
    node.subTopicCount = 0
    return 1
  }

  let totalSubTopics = 0
  for (const child of node.children) {
    totalSubTopics += updateSubTopicCounts(child)
  }
  node.subTopicCount = totalSubTopics
  return totalSubTopics + 1
}

/**
 * Recursively finds all subtopics for a given node in the topic tree.
 *
 * @param node - The current node in the topic tree to find subtopics for.
 * @param isRoot - A boolean indicating whether the current node is the root node.
 * @returns An array of strings representing the subtopics.
 */
export function findSubTopics(node: TopicTreeNode, isRoot = true): string[] {
  const subTopics: string[] = []
  const collect = (subNode: TopicTreeNode) => {
    if (subNode.label) subTopics.push(subNode.label)
    subNode.children?.forEach(collect)
  }
  if (isRoot) node.children?.forEach(collect)
  else collect(node)
  return subTopics
}

/**
 * Finds the full topic path for a given node ID in the topic tree.
 *
 * @param treeData - The entire topic tree data structure.
 * @param targetId - The ID of the node to find the full path for.
 * @returns The full topic path as a string, or null if the node is not found.
 */
export function findFullTopicPath(treeData: TopicTreeNode[], targetId: string): string | null {
  const currentPath: string[] = []

  function findPath(node: TopicTreeNode): boolean {
    if (node.id === targetId) {
      return true
    }
    if (node.children) {
      for (const child of node.children) {
        currentPath.push(child.label)
        if (findPath(child)) {
          return true
        }
        currentPath.pop()
      }
    }
    return false
  }
  for (const rootNode of treeData) {
    if (rootNode.connectionInfo) {
      if (findPath(rootNode)) {
        return currentPath.join('/')
      }
    }
  }
  return null
}

/**
 * Retrieves all IDs from the given topic tree nodes and their children.
 *
 * @param nodes - An array of TopicTreeNode representing the topic tree nodes.
 * @returns An array of strings containing all IDs from the nodes and their children.
 */
export function getAllIDs(nodes: TopicTreeNode[]): string[] {
  let ids: string[] = []
  for (const node of nodes) {
    ids.push(node.id)
    if (node.children && node.children.length > 0) {
      ids = ids.concat(getAllIDs(node.children))
    }
  }
  return ids
}

/**
 * Checks if the given payload is empty.
 *
 * @param payload - The payload to check. Can be a string, Buffer, null, or undefined.
 * @returns True if the payload is null or undefined, false otherwise.
 */
export function isPayloadEmpty(payload: string | Buffer | null | undefined): boolean {
  return payload === null || payload === undefined
}

/**
 * Build a topic tree from message statistics data
 * @param connection - Connection information
 * @param topicStats - Topic statistics data containing message counts and latest messages
 * @returns A tree structure representing the topic hierarchy
 */
export function buildTopicTreeFromStats(
  connection: ConnectionModel,
  topicStats: Array<TopicNodeStats & { latestMessage?: MessageModel }>,
): TopicTreeNode {
  const connectionId = connection.id ?? ''

  // Create root node
  const rootNode: TopicTreeNode = {
    id: connectionId,
    label: connection.host,
    messageCount: 0,
    subTopicCount: 0,
    children: [],
    connectionInfo: connection,
  }

  function insertTopic(
    parentNode: TopicTreeNode,
    segments: string[],
    stat: TopicNodeStats & { latestMessage?: MessageModel },
  ) {
    if (segments.length === 0) return

    const currentSegment = segments[0]
    let currentNode = parentNode.children?.find((child) => child.label === currentSegment)

    if (!currentNode) {
      const childIndex = parentNode.children?.length
      currentNode = {
        id: `${parentNode.id}_${childIndex}`,
        label: currentSegment,
        messageCount: 0,
        subTopicCount: 0,
        children: [],
      }
      parentNode.children?.push(currentNode)
    }

    if (segments.length === 1) {
      currentNode.messageCount = stat.msgCount
      currentNode.message = stat.latestMessage
    } else {
      insertTopic(currentNode, segments.slice(1), stat)
    }
  }

  // Insert all topics
  topicStats.forEach((stat) => {
    const segments = stat.msgTopic.split('/').filter(Boolean)
    insertTopic(rootNode, segments, stat)
  })

  // Calculate subTopicCount and messageCount for all nodes
  function calculateCounts(node: TopicTreeNode): { subCount: number; msgCount: number } {
    let subCount = node.children?.length ?? 0
    let msgCount = node.message ? node.messageCount : 0

    for (const child of node.children ?? []) {
      const counts = calculateCounts(child)
      subCount += counts.subCount
      msgCount += counts.msgCount
    }

    node.subTopicCount = subCount
    node.messageCount = msgCount

    return { subCount, msgCount }
  }
  calculateCounts(rootNode)
  return rootNode
}

/**
 * Flattens a topic tree into an array of nodes
 * Each node in the result will have its children array emptied
 * and will have a parentId property set (except for the root node)
 * @param topicTree The root node of the topic tree to flatten
 * @returns Array of flattened topic tree nodes
 */
export function flattenTopicTree(topicTree: TopicTreeNode): TopicTreeNode[] {
  const result: TopicTreeNode[] = []
  function flatten(node: TopicTreeNode) {
    const flatNode: TopicTreeNode = { ...node, children: [] }
    result.push(flatNode)
    node.children?.forEach((child) => {
      child.parentId = node.id
      flatten(child)
    })
  }
  flatten(topicTree)
  return result
}
