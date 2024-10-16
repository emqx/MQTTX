import { Buffer } from 'buffer'
import { IPublishPacket } from 'mqtt-packet/types'
import time from './time'

/**
 * Updates the topic tree data structure based on received MQTT packets.
 *
 * @param {TopicTreeNode[]} currentTree - The current state of the topic tree.
 * @param {Object} rawData - The raw data containing the MQTT packet and connection information.
 * @param {IPublishPacket} rawData.packet - The MQTT publish packet.
 * @param {ConnectionModel} rawData.connectionInfo - The connection information.
 * @returns {TopicTreeNode[]} The updated topic tree data structure.
 */
export function updateTopicTreeNode(
  currentTree: TopicTreeNode[],
  rawData: {
    packet: IPublishPacket
    connectionInfo: ConnectionModel
  },
): TopicTreeNode[] {
  const { packet, connectionInfo } = rawData
  if (packet.cmd !== 'publish') {
    return currentTree
  }

  const { topic, payload, qos, retain } = packet
  const payloadString = Buffer.from(payload).toString()
  const topicLevels = topic.split('/')
  const currentTime = time.getNowDate()

  let updatedTree = [...currentTree]
  let hostNode = updatedTree.find((node) => node.id === connectionInfo.id)

  if (!hostNode) {
    hostNode = {
      id: connectionInfo.id ?? '',
      label: connectionInfo.host,
      latestMessage: undefined,
      messageCount: 0,
      subTopicCount: 0,
      children: [],
      connectionInfo,
    }
    updatedTree.push(hostNode)
  }

  hostNode.messageCount++

  let currentNode = hostNode
  let currentId = connectionInfo.id
  for (let i = 0; i < topicLevels.length; i++) {
    const level = topicLevels[i]
    const childIndex = currentNode.children?.findIndex((n) => n.label === level) ?? -1
    let childNode: TopicTreeNode

    if (childIndex === -1) {
      currentId = `${currentId}-${currentNode.children?.length ?? 0 + 1}`
      childNode = {
        id: currentId,
        label: level,
        latestMessage: undefined,
        messageCount: 0,
        subTopicCount: 0,
        children: [],
        qos: undefined,
        time: undefined,
        retain: undefined,
      }
      if (currentNode.children) {
        currentNode.children.push(childNode)
      } else {
        currentNode.children = [childNode]
      }
    } else {
      childNode = currentNode.children![childIndex]
      currentId = childNode.id
    }

    childNode.messageCount++

    if (i === topicLevels.length - 1) {
      childNode.latestMessage = payloadString
      childNode.qos = qos
      childNode.time = currentTime
      childNode.retain = retain
    }

    currentNode = childNode
  }

  updateSubTopicCounts(hostNode)

  return updatedTree
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
