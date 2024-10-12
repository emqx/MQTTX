import { Buffer } from 'buffer'
import { IPublishPacket } from 'mqtt-packet/types'

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

  const { topic, payload } = packet
  const payloadString = Buffer.from(payload).toString()
  const topicLevels = topic.split('/')

  let updatedTree = [...currentTree]
  let hostNode = updatedTree.find((node) => node.label === connectionInfo.host)

  if (!hostNode) {
    hostNode = {
      label: connectionInfo.host,
      name: connectionInfo.name,
      latestMessage: '',
      messageCount: 0,
      subTopicCount: 0,
      children: [],
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
    }

    currentNode = childNode
  }

  updateSubTopicCounts(hostNode)

  return updatedTree
}

function updateSubTopicCounts(node: TopicTreeData): number {
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
