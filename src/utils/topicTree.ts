import { Buffer } from 'buffer'
import { IPublishPacket } from 'mqtt-packet/types'
import time from './time'

/**
 * Updates the topic tree data structure based on received MQTT packets.
 *
 * @param {TopicTreeData[]} currentTree - The current state of the topic tree.
 * @param {Object} rawData - The raw data containing the MQTT packet and connection information.
 * @param {IPublishPacket} rawData.packet - The MQTT publish packet.
 * @param {ConnectionModel} rawData.connectionInfo - The connection information.
 * @returns {TopicTreeData[]} The updated topic tree data structure.
 */

export function updateTopicTreeData(
  currentTree: TopicTreeData[],
  rawData: {
    packet: IPublishPacket
    connectionInfo: ConnectionModel
  },
): TopicTreeData[] {
  const { packet, connectionInfo } = rawData
  if (packet.cmd !== 'publish') {
    return currentTree
  }

  const { topic, payload, qos, retain } = packet
  const payloadString = Buffer.from(payload).toString()
  const topicLevels = topic.split('/')
  const currentTime = time.getNowDate()

  let updatedTree = [...currentTree]
  let hostNode = updatedTree.find((node) => node.label === connectionInfo.host)

  if (!hostNode) {
    hostNode = {
      label: connectionInfo.host,
      latestMessage: '',
      messageCount: 0,
      subTopicCount: 0,
      children: [],
      connectionInfo,
    }
    updatedTree.push(hostNode)
  }

  hostNode.messageCount++

  let currentNode = hostNode
  for (let i = 0; i < topicLevels.length; i++) {
    const level = topicLevels[i]
    let childNode = currentNode.children?.find((n) => n.label === level)

    if (!childNode) {
      childNode = {
        label: level,
        latestMessage: '',
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
export function updateSubTopicCounts(node: TopicTreeData): number {
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
export function findSubTopics(node: TopicTreeData, isRoot: boolean = true): string[] {
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
 * Finds the full topic path for a given node label in the topic tree.
 *
 * @param treeData - The entire topic tree data structure.
 * @param targetLabel - The label of the node to find the full path for.
 * @returns The full topic path as a string, or null if the node is not found.
 */
export function findFullTopicPath(treeData: TopicTreeData[], targetLabel: string): string | null {
  function findPath(node: TopicTreeData, currentPath: string[]): string[] | null {
    if (node.label === targetLabel) {
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
