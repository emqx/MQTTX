import { expect } from 'chai'
import {
  updateTopicTreeNode,
  updateSubTopicCounts,
  findSubTopics,
  findFullTopicPath,
  getAllIDs,
  isPayloadEmpty,
  groupedMessagesByConnectionID,
} from '@/utils/topicTree'
import { IPublishPacket } from 'mqtt-packet'

const connectionInfo: ConnectionModel = {
  id: 'test-connection-id',
  clientId: 'mqttx_2b6060e3',
  name: 'test',
  clean: true,
  protocol: 'wss',
  host: 'broker.emqx.io',
  port: 8084,
  keepalive: 60,
  connectTimeout: 10,
  reconnect: true,
  reconnectPeriod: 4000,
  username: '',
  password: '',
  path: '/mqtt',
  certType: 'server',
  ssl: true,
  mqttVersion: '5.0',
  unreadMessageCount: 0,
  clientIdWithTime: false,
  parentId: 'collection_a457e1fe-1ab8-47a4-9b38-d168b603333e',
  orderId: 0,
  rejectUnauthorized: true,
  ALPNProtocols: '',
  ca: '',
  cert: '',
  key: '',
  isCollection: false,
  createAt: '2024-07-29T09:51:12.751Z',
  updateAt: '2024-10-15T08:39:43.870Z',
  messages: [],
  subscriptions: [],
}

describe('Topic Tree Functions', () => {
  it('should update topic tree data with IDs and return updated nodes', () => {
    const currentTree: TopicTreeNode[] = []
    const packet: IPublishPacket = {
      cmd: 'publish',
      topic: 'sensors/temperature/living-room',
      payload: Buffer.from('25.5'),
      qos: 1,
      dup: false,
      retain: false,
    }

    const result = updateTopicTreeNode(currentTree, { packet, connectionInfo })

    expect(result.updatedTree).to.have.lengthOf(1)
    expect(result.updatedNodes).to.have.lengthOf(4) // Host + sensors + temperature + living-room

    const updatedTree = result.updatedTree
    const updatedNodes = result.updatedNodes

    // Check tree structure
    expect(updatedTree[0].id).to.equal('test-connection-id')
    expect(updatedTree[0].children?.[0].id).to.equal('test-connection-id_0')
    expect(updatedTree[0].children?.[0].children?.[0].id).to.equal('test-connection-id_0_0')
    expect(updatedTree[0].children?.[0].children?.[0].children?.[0].id).to.equal('test-connection-id_0_0_0')

    // Check updated nodes without assuming order
    const expectedNodes = [
      { id: 'test-connection-id_0_0_0', label: 'living-room', messageCount: 1, hasMessage: true },
      { id: 'test-connection-id_0_0', label: 'temperature', messageCount: 1 },
      { id: 'test-connection-id_0', label: 'sensors', messageCount: 1 },
      { id: 'test-connection-id', label: 'broker.emqx.io', messageCount: 1 },
    ]

    expectedNodes.forEach((expected) => {
      const node = updatedNodes.find((n) => n.id === expected.id)
      expect(node).to.exist
      expect(node!.label).to.equal(expected.label)
      expect(node!.messageCount).to.equal(expected.messageCount)
      if (expected.hasMessage) {
        expect(node!.message).to.exist
        expect(node!.message!.payload).to.equal('25.5')
      }
    })
  })

  it('should correctly update complex tree structure and return accurate updatedNodes', () => {
    // 初始树结构
    const initialTree: TopicTreeNode[] = [
      {
        id: 'test-connection-id',
        label: 'broker.emqx.io',
        messageCount: 0,
        subTopicCount: 0,
        children: [
          {
            id: 'test-connection-id_0',
            label: 'sensors',
            messageCount: 0,
            subTopicCount: 0,
            children: [
              {
                id: 'test-connection-id_0_0',
                label: 'temperature',
                messageCount: 1,
                subTopicCount: 0,
                children: [],
              },
            ],
          },
        ],
        connectionInfo,
      },
    ]

    const testCases = [
      {
        description: 'Update existing leaf node',
        packet: {
          cmd: 'publish',
          topic: 'sensors/temperature',
          payload: Buffer.from('25.5'),
          qos: 1,
          retain: false,
        } as IPublishPacket,
        expectedUpdatedNodesCount: 3,
        expectedUpdatedNodeIds: ['test-connection-id_0_0', 'test-connection-id_0', 'test-connection-id'],
      },
      {
        description: 'Add new leaf node',
        packet: {
          cmd: 'publish',
          topic: 'sensors/humidity',
          payload: Buffer.from('60%'),
          qos: 1,
          retain: false,
        } as IPublishPacket,
        expectedUpdatedNodesCount: 3,
        expectedUpdatedNodeIds: ['test-connection-id_0_1', 'test-connection-id_0', 'test-connection-id'],
      },
      {
        description: 'Add new branch and leaf',
        packet: {
          cmd: 'publish',
          topic: 'actuators/valve/status',
          payload: Buffer.from('open'),
          qos: 1,
          retain: false,
        } as IPublishPacket,
        expectedUpdatedNodesCount: 4,
        expectedUpdatedNodeIds: [
          'test-connection-id_1_0_0',
          'test-connection-id_1_0',
          'test-connection-id_1',
          'test-connection-id',
        ],
      },
    ]

    let currentTree = initialTree

    testCases.forEach((testCase) => {
      const result = updateTopicTreeNode(currentTree, { packet: testCase.packet, connectionInfo })
      currentTree = result.updatedTree

      expect(result.updatedNodes.length, `${testCase.description}: Incorrect number of updated nodes`).to.equal(
        testCase.expectedUpdatedNodesCount,
      )

      const updatedNodeIds = result.updatedNodes.map((node) => node.id)
      expect(updatedNodeIds, `${testCase.description}: Incorrect updated node IDs`).to.have.members(
        testCase.expectedUpdatedNodeIds,
      )
      result.updatedNodes.forEach((node) => {
        if (node.id === testCase.expectedUpdatedNodeIds[0]) {
          expect(node.message?.payload, `${testCase.description}: Incorrect leaf node payload`).to.equal(
            testCase.packet.payload.toString(),
          )
        }
        expect(node.messageCount, `${testCase.description}: Node ${node.id} has incorrect message count`).to.be.above(0)
      })
      const topicLevels = testCase.packet.topic.split('/')
      let currentNode = currentTree[0]
      topicLevels.forEach((level, index) => {
        const child = currentNode.children?.find((c) => c.label === level)
        expect(child, `${testCase.description}: Missing expected node ${level}`).to.exist
        if (index === topicLevels.length - 1) {
          expect(child!.message?.payload, `${testCase.description}: Incorrect payload for ${level}`).to.equal(
            testCase.packet.payload.toString(),
          )
        }
        currentNode = child!
      })
    })
  })

  it('should update existing tree node and return only changed nodes', () => {
    const currentTree: TopicTreeNode[] = [
      {
        id: 'test-connection-id',
        label: 'broker.emqx.io',
        message: undefined,
        messageCount: 0,
        subTopicCount: 0,
        children: [],
        connectionInfo: connectionInfo,
      },
    ]
    const packet: IPublishPacket = {
      cmd: 'publish',
      topic: 'sensors/temperature',
      payload: Buffer.from('20.5'),
      qos: 0,
      dup: false,
      retain: false,
    }

    const result = updateTopicTreeNode(currentTree, { packet, connectionInfo })

    expect(result.updatedNodes).to.have.lengthOf(3) // Host + sensors + temperature
    expect(result.updatedNodes[2].id).to.equal('test-connection-id')
    expect(result.updatedNodes[2].messageCount).to.equal(1)
  })

  it('should update subTopicCounts correctly', () => {
    const node: TopicTreeNode = {
      id: 'root',
      label: 'root',
      message: undefined,
      messageCount: 0,
      subTopicCount: 0,
      children: [
        {
          id: 'child1',
          label: 'child1',
          message: undefined,
          messageCount: 0,
          subTopicCount: 0,
          children: [],
        },
        {
          id: 'child2',
          label: 'child2',
          message: undefined,
          messageCount: 0,
          subTopicCount: 0,
          children: [
            {
              id: 'grandchild',
              label: 'grandchild',
              message: undefined,
              messageCount: 0,
              subTopicCount: 0,
              children: [],
            },
          ],
        },
      ],
    }

    const result = updateSubTopicCounts(node)

    expect(result).to.equal(4) // root + 2 children + 1 grandchild
    expect(node.subTopicCount).to.equal(3) // 2 children + 1 grandchild
    expect(node.children![1].subTopicCount).to.equal(1) // 1 grandchild
  })

  it('should find subtopics correctly', () => {
    const node: TopicTreeNode = {
      id: 'root',
      label: 'root',
      message: undefined,
      messageCount: 0,
      subTopicCount: 0,
      children: [
        { id: 'child1', label: 'child1', message: undefined, messageCount: 0, subTopicCount: 0, children: [] },
        { id: 'child2', label: 'child2', message: undefined, messageCount: 0, subTopicCount: 0, children: [] },
      ],
    }

    const subTopics = findSubTopics(node)
    expect(subTopics).to.deep.equal(['child1', 'child2'])
  })

  it('should find full topic path', () => {
    const treeData: TopicTreeNode[] = [
      {
        id: 'conn1',
        label: 'conn1',
        message: undefined,
        messageCount: 0,
        subTopicCount: 0,
        connectionInfo: {} as ConnectionModel,
        children: [
          {
            id: 'conn1_0',
            label: 'sensors',
            message: undefined,
            messageCount: 0,
            subTopicCount: 0,
            children: [
              {
                id: 'conn1_0_0',
                label: 'temperature',
                message: undefined,
                messageCount: 0,
                subTopicCount: 0,
                children: [],
              },
            ],
          },
        ],
      },
    ]

    const path = findFullTopicPath(treeData, 'conn1_0_0')
    expect(path).to.equal('sensors/temperature')
  })

  it('should get all IDs', () => {
    const nodes: TopicTreeNode[] = [
      {
        id: 'root',
        label: 'root',
        message: undefined,
        messageCount: 0,
        subTopicCount: 0,
        children: [
          { id: 'child1', label: 'child1', message: undefined, messageCount: 0, subTopicCount: 0, children: [] },
          { id: 'child2', label: 'child2', message: undefined, messageCount: 0, subTopicCount: 0, children: [] },
        ],
      },
    ]

    const ids = getAllIDs(nodes)
    expect(ids).to.deep.equal(['root', 'child1', 'child2'])
  })

  it('should check if payload is empty', () => {
    expect(isPayloadEmpty(null)).to.be.true
    expect(isPayloadEmpty(undefined)).to.be.true
    expect(isPayloadEmpty('')).to.be.false
    expect(isPayloadEmpty(Buffer.from(''))).to.be.false
  })

  it('should group messages by connection ID', () => {
    const updatedNodes: TopicTreeNode[][] = [
      [
        {
          id: 'conn1_0_0',
          label: 'topic1',
          message: { payload: 'message1', topic: 'topic1' } as MessageModel,
          messageCount: 1,
          subTopicCount: 0,
          children: [],
        },
        {
          id: 'conn1_0_1',
          label: 'topic2',
          message: { payload: 'message2', topic: 'topic2' } as MessageModel,
          messageCount: 1,
          subTopicCount: 0,
          children: [],
        },
      ],
      [
        {
          id: 'conn2_0_0',
          label: 'topic3',
          message: { payload: 'message3', topic: 'topic3' } as MessageModel,
          messageCount: 1,
          subTopicCount: 0,
          children: [],
        },
      ],
    ]

    const groupedMessages = groupedMessagesByConnectionID(updatedNodes)

    expect(groupedMessages.size).to.equal(2)
    expect(groupedMessages.get('conn1')?.length).to.equal(2)
    expect(groupedMessages.get('conn2')?.length).to.equal(1)
    expect(groupedMessages.get('conn1')?.[0].payload).to.equal('message1')
    expect(groupedMessages.get('conn1')?.[1].payload).to.equal('message2')
    expect(groupedMessages.get('conn2')?.[0].payload).to.equal('message3')
  })
})
