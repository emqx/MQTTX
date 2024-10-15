import { expect } from 'chai'
import {
  updateTopicTreeData,
  updateSubTopicCounts,
  findSubTopics,
  findFullTopicPath,
  getAllLabels,
} from '@/utils/topicTree'
import { IPublishPacket } from 'mqtt-packet'

const connectionInfo: ConnectionModel = {
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
  it('should update topic tree data', () => {
    const currentTree: TopicTreeData[] = []
    const packet: IPublishPacket = {
      cmd: 'publish',
      topic: 'sensors/temperature/living-room',
      payload: Buffer.from('25.5'),
      qos: 1,
      dup: false,
      retain: false,
    }

    const updatedTree = updateTopicTreeData(currentTree, { packet, connectionInfo })

    expect(updatedTree).to.have.lengthOf(1)
    expect(updatedTree[0].label).to.equal('broker.emqx.io')
    expect(updatedTree[0].children).to.have.lengthOf(1)
    expect(updatedTree[0].children?.[0].label).to.equal('sensors')
  })

  it('should update sub topic counts', () => {
    const tree: TopicTreeData = {
      label: 'root',
      latestMessage: '',
      messageCount: 0,
      subTopicCount: 0,
      children: [
        {
          label: 'child1',
          latestMessage: '',
          messageCount: 0,
          subTopicCount: 0,
          children: [],
        },
        {
          label: 'child2',
          latestMessage: '',
          messageCount: 0,
          subTopicCount: 0,
          children: [
            {
              label: 'grandchild',
              latestMessage: '',
              messageCount: 0,
              subTopicCount: 0,
              children: [],
            },
          ],
        },
      ],
    }

    updateSubTopicCounts(tree)

    expect(tree.subTopicCount).to.equal(3)
    if (tree.children) {
      expect(tree.children[0].subTopicCount).to.equal(0)
      expect(tree.children[1].subTopicCount).to.equal(1)
    }
  })

  it('should find sub topics', () => {
    const tree: TopicTreeData = {
      label: 'root',
      latestMessage: '',
      messageCount: 0,
      subTopicCount: 0,
      children: [
        { label: 'child1', latestMessage: '', messageCount: 0, subTopicCount: 0, children: [] },
        {
          label: 'child2',
          latestMessage: '',
          messageCount: 0,
          subTopicCount: 0,
          children: [{ label: 'grandchild', latestMessage: '', messageCount: 0, subTopicCount: 0, children: [] }],
        },
      ],
    }

    const subTopics = findSubTopics(tree)
    expect(subTopics).to.deep.equal(['child1', 'child2', 'grandchild'])
  })

  it('should find full topic path', () => {
    const tree: TopicTreeData[] = [
      {
        label: 'broker.emqx.io',
        latestMessage: '',
        messageCount: 0,
        subTopicCount: 0,
        children: [
          {
            label: 'sensors',
            latestMessage: '',
            messageCount: 0,
            subTopicCount: 0,
            children: [
              {
                label: 'temperature',
                latestMessage: '',
                messageCount: 0,
                subTopicCount: 0,
                children: [
                  { label: 'living-room', latestMessage: '', messageCount: 0, subTopicCount: 0, children: [] },
                ],
              },
            ],
          },
        ],
        connectionInfo: connectionInfo,
      },
    ]

    const fullPath = findFullTopicPath(tree, 'living-room')
    expect(fullPath).to.equal('sensors/temperature/living-room')
  })

  it('should get all labels', () => {
    const tree: TopicTreeData[] = [
      {
        label: 'root',
        latestMessage: '',
        messageCount: 0,
        subTopicCount: 0,
        children: [
          { label: 'child1', latestMessage: '', messageCount: 0, subTopicCount: 0, children: [] },
          {
            label: 'child2',
            latestMessage: '',
            messageCount: 0,
            subTopicCount: 0,
            children: [{ label: 'grandchild', latestMessage: '', messageCount: 0, subTopicCount: 0, children: [] }],
          },
        ],
      },
    ]

    const labels = getAllLabels(tree)
    expect(labels).to.deep.equal(['root', 'child1', 'child2', 'grandchild'])
  })

  it('should update existing tree node', () => {
    const currentTree: TopicTreeData[] = [
      {
        label: 'broker.emqx.io',
        latestMessage: '',
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

    const updatedTree = updateTopicTreeData(currentTree, { packet, connectionInfo })

    expect(updatedTree[0].messageCount).to.equal(1)
    expect(updatedTree[0].children?.[0].label).to.equal('sensors')
    expect(updatedTree[0].children?.[0].children?.[0].label).to.equal('temperature')
    expect(updatedTree[0].children?.[0].children?.[0].latestMessage).to.equal('20.5')
  })

  it('should not update tree for non-publish packets', () => {
    const currentTree: TopicTreeData[] = []
    const packet = { cmd: 'subscribe' } as any

    const updatedTree = updateTopicTreeData(currentTree, { packet, connectionInfo })

    expect(updatedTree).to.deep.equal(currentTree)
  })

  it('should update sub topic counts for deep nested tree', () => {
    const tree: TopicTreeData = {
      label: 'root',
      latestMessage: '',
      messageCount: 0,
      subTopicCount: 0,
      children: [
        {
          label: 'level1',
          latestMessage: '',
          messageCount: 0,
          subTopicCount: 0,
          children: [
            {
              label: 'level2',
              latestMessage: '',
              messageCount: 0,
              subTopicCount: 0,
              children: [
                {
                  label: 'level3',
                  latestMessage: '',
                  messageCount: 0,
                  subTopicCount: 0,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    }

    updateSubTopicCounts(tree)

    expect(tree.subTopicCount).to.equal(3)
    expect(tree.children?.[0].subTopicCount).to.equal(2)
    expect(tree.children?.[0].children?.[0].subTopicCount).to.equal(1)
    expect(tree.children?.[0].children?.[0].children?.[0].subTopicCount).to.equal(0)
  })

  it('should find sub topics for root node', () => {
    const tree: TopicTreeData = {
      label: 'root',
      latestMessage: '',
      messageCount: 0,
      subTopicCount: 0,
      children: [
        { label: 'child1', latestMessage: '', messageCount: 0, subTopicCount: 0, children: [] },
        { label: 'child2', latestMessage: '', messageCount: 0, subTopicCount: 0, children: [] },
      ],
    }

    const subTopics = findSubTopics(tree)
    expect(subTopics).to.deep.equal(['child1', 'child2'])
  })

  it('should return null for non-existent topic path', () => {
    const tree: TopicTreeData[] = [
      {
        label: 'broker.emqx.io',
        latestMessage: '',
        messageCount: 0,
        subTopicCount: 0,
        children: [],
        connectionInfo: connectionInfo,
      },
    ]

    const fullPath = findFullTopicPath(tree, 'non-existent')
    expect(fullPath).to.be.null
  })

  it('should get all labels for empty tree', () => {
    const tree: TopicTreeData[] = []

    const labels = getAllLabels(tree)
    expect(labels).to.deep.equal([])
  })
})
