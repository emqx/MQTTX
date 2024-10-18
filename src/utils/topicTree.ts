import { Buffer } from 'buffer'
import { IPublishPacket } from 'mqtt-packet/types'
import time from '@/utils/time'
import { getMessageId } from '@/utils/idGenerator'

/**
 * Updates the topic tree structure with new message data.
 *
 * @param currentTree - The current state of the topic tree.
 * @param rawData - An object containing the MQTT packet and connection information.
 * @returns An object containing the updated tree and a list of updated nodes.
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
} {
  const { packet, connectionInfo } = rawData
  const { topic, payload, qos, retain, properties } = packet
  const payloadString = Buffer.from(payload).toString()
  const topicLevels = topic.split('/')
  const currentTime = time.getNowDate()
  const currentProperties = properties ?? {}

  let updatedTree = [...currentTree]
  let hostNode = updatedTree.find((node) => node.id === connectionInfo.id)
  let updatedNodes: TopicTreeNode[] = []
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
    updatedTree.push(hostNode)
    isNewHost = true
  }

  const originalHostMessageCount = hostNode.messageCount

  hostNode.messageCount++

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

    currentNode = childNode
  }

  const originalSubTopicCount = hostNode.subTopicCount
  updateSubTopicCounts(hostNode)

  if (
    isNewHost ||
    hostNode.messageCount !== originalHostMessageCount ||
    hostNode.subTopicCount !== originalSubTopicCount
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

  return { updatedTree, updatedNodes: simplifiedUpdatedNodes }
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
export function findSubTopics(node: TopicTreeNode, isRoot: boolean = true): string[] {
  let subTopics: string[] = []
  if (!isRoot && node.label) {
    subTopics.push(node.label)
  }
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      subTopics = subTopics.concat(findSubTopics(child, false))
    }
  }
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
  function findPath(node: TopicTreeNode, currentPath: string[]): string[] | null {
    if (node.id === targetId) {
      return currentPath
    }
    if (node.children) {
      for (const child of node.children) {
        const result = findPath(child, [...currentPath, child.label])
        if (result) {
          return result
        }
      }
    }
    return null
  }
  for (const rootNode of treeData) {
    if (rootNode.connectionInfo) {
      const result = findPath(rootNode, [])
      if (result) {
        return result.join('/')
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
