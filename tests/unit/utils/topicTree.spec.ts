// import { expect } from 'chai'
// import {
//   updateTopicTreeNode,
//   updateSubTopicCounts,
//   findSubTopics,
//   findFullTopicPath,
//   getAllIDs,
//   isPayloadEmpty,
// } from '@/utils/topicTree'
// import { IPublishPacket } from 'mqtt-packet'

// const connectionInfo: ConnectionModel = {
//   id: 'test_connection_id',
//   clientId: 'mqttx_2b6060e3',
//   name: 'test',
//   clean: true,
//   protocol: 'wss',
//   host: 'broker.emqx.io',
//   port: 8084,
//   keepalive: 60,
//   connectTimeout: 10,
//   reconnect: true,
//   reconnectPeriod: 4000,
//   username: '',
//   password: '',
//   path: '/mqtt',
//   certType: 'server',
//   ssl: true,
//   mqttVersion: '5.0',
//   unreadMessageCount: 0,
//   clientIdWithTime: false,
//   parentId: 'collection_a457e1fe-1ab8-47a4-9b38-d168b603333e',
//   orderId: 0,
//   rejectUnauthorized: true,
//   ALPNProtocols: '',
//   ca: '',
//   cert: '',
//   key: '',
//   isCollection: false,
//   createAt: '2024-07-29T09:51:12.751Z',
//   updateAt: '2024-10-15T08:39:43.870Z',
//   messages: [],
//   subscriptions: [],
// }

// describe('Topic Tree Functions', () => {
//   it('should update topic tree data with IDs', () => {
//     const currentTree: TopicTreeNode[] = []
//     const packet1: IPublishPacket = {
//       cmd: 'publish',
//       topic: 'sensors/temperature/living-room',
//       payload: Buffer.from('25.5'),
//       qos: 1,
//       dup: false,
//       retain: false,
//     }
//     const packet2: IPublishPacket = {
//       cmd: 'publish',
//       topic: 'sensors/humidity/bedroom',
//       payload: Buffer.from('60%'),
//       qos: 1,
//       dup: false,
//       retain: false,
//     }

//     let updatedTree = updateTopicTreeNode(currentTree, { packet: packet1, connectionInfo })
//     updatedTree = updateTopicTreeNode(updatedTree, { packet: packet2, connectionInfo })

//     expect(updatedTree).to.have.lengthOf(1)
//     expect(updatedTree[0].id).to.equal('test_connection_id')
//     expect(updatedTree[0].label).to.equal('broker.emqx.io')
//     expect(updatedTree[0].children).to.have.lengthOf(1)
//     expect(updatedTree[0].children?.[0].id).to.equal('test_connection_id-0')
//     expect(updatedTree[0].children?.[0].label).to.equal('sensors')
//     expect(updatedTree[0].children?.[0].children).to.have.lengthOf(2)
//     expect(updatedTree[0].children?.[0].children?.[0].id).to.equal('test_connection_id-0-0')
//     expect(updatedTree[0].children?.[0].children?.[0].label).to.equal('temperature')
//     expect(updatedTree[0].children?.[0].children?.[1].id).to.equal('test_connection_id-0-1')
//     expect(updatedTree[0].children?.[0].children?.[1].label).to.equal('humidity')
//     expect(updatedTree[0].children?.[0].children?.[0].children?.[0].id).to.equal('test_connection_id-0-0-0')
//     expect(updatedTree[0].children?.[0].children?.[0].children?.[0].label).to.equal('living-room')
//     expect(updatedTree[0].children?.[0].children?.[1].children?.[0].id).to.equal('test_connection_id-0-1-0')
//     expect(updatedTree[0].children?.[0].children?.[1].children?.[0].label).to.equal('bedroom')
//   })

//   it('should update existing tree node and add new siblings', () => {
//     const currentTree: TopicTreeNode[] = [
//       {
//         id: 'test_connection_id',
//         label: 'broker.emqx.io',
//         message: undefined,
//         messageCount: 0,
//         subTopicCount: 0,
//         children: [],
//         connectionInfo: connectionInfo,
//       },
//     ]
//     const packet1: IPublishPacket = {
//       cmd: 'publish',
//       topic: 'sensors/temperature',
//       payload: Buffer.from('20.5'),
//       qos: 0,
//       dup: false,
//       retain: false,
//     }
//     const packet2: IPublishPacket = {
//       cmd: 'publish',
//       topic: 'sensors/humidity',
//       payload: Buffer.from('60%'),
//       qos: 0,
//       dup: false,
//       retain: false,
//     }

//     let updatedTree = updateTopicTreeNode(currentTree, { packet: packet1, connectionInfo })
//     updatedTree = updateTopicTreeNode(updatedTree, { packet: packet2, connectionInfo })

//     expect(updatedTree[0].messageCount).to.equal(2)
//     expect(updatedTree[0].children?.[0].id).to.equal('test_connection_id-0')
//     expect(updatedTree[0].children?.[0].label).to.equal('sensors')
//     expect(updatedTree[0].children?.[0].children).to.have.lengthOf(2)
//     expect(updatedTree[0].children?.[0].children?.[0].id).to.equal('test_connection_id-0-0')
//     expect(updatedTree[0].children?.[0].children?.[0].label).to.equal('temperature')
//     expect(updatedTree[0].children?.[0].children?.[0].message?.payload).to.equal('20.5')
//     expect(updatedTree[0].children?.[0].children?.[1].id).to.equal('test_connection_id-0-1')
//     expect(updatedTree[0].children?.[0].children?.[1].label).to.equal('humidity')
//     expect(updatedTree[0].children?.[0].children?.[1].message?.payload).to.equal('60%')
//   })

//   it('should update sub topic counts', () => {
//     const tree: TopicTreeNode = {
//       id: 'root',
//       label: 'root',
//       message: undefined,
//       messageCount: 0,
//       subTopicCount: 0,
//       children: [
//         {
//           id: 'root-1',
//           label: 'child1',
//           message: undefined,
//           messageCount: 0,
//           subTopicCount: 0,
//           children: [],
//         },
//         {
//           id: 'root-2',
//           label: 'child2',
//           message: undefined,
//           messageCount: 0,
//           subTopicCount: 0,
//           children: [
//             {
//               id: 'root-2-1',
//               label: 'grandchild',
//               message: undefined,
//               messageCount: 0,
//               subTopicCount: 0,
//               children: [],
//             },
//           ],
//         },
//       ],
//     }

//     updateSubTopicCounts(tree)

//     expect(tree.subTopicCount).to.equal(3)
//     if (tree.children) {
//       expect(tree.children[0].subTopicCount).to.equal(0)
//       expect(tree.children[1].subTopicCount).to.equal(1)
//     }
//   })

//   it('should find sub topics', () => {
//     const tree: TopicTreeNode = {
//       id: 'root',
//       label: 'root',
//       message: undefined,
//       messageCount: 0,
//       subTopicCount: 0,
//       children: [
//         { id: 'root-1', label: 'child1', message: undefined, messageCount: 0, subTopicCount: 0, children: [] },
//         {
//           id: 'root-2',
//           label: 'child2',
//           message: undefined,
//           messageCount: 0,
//           subTopicCount: 0,
//           children: [
//             {
//               id: 'root-2-1',
//               label: 'grandchild',
//               message: undefined,
//               messageCount: 0,
//               subTopicCount: 0,
//               children: [],
//             },
//           ],
//         },
//       ],
//     }

//     const subTopics = findSubTopics(tree)
//     expect(subTopics).to.deep.equal(['child1', 'child2', 'grandchild'])
//   })

//   it('should find full topic path', () => {
//     const tree: TopicTreeNode[] = [
//       {
//         id: 'test_connection_id',
//         label: 'broker.emqx.io',
//         message: undefined,
//         messageCount: 0,
//         subTopicCount: 0,
//         children: [
//           {
//             id: 'test_connection_id-0',
//             label: 'sensors',
//             message: undefined,
//             messageCount: 0,
//             subTopicCount: 0,
//             children: [
//               {
//                 id: 'test_connection_id-0-0',
//                 label: 'temperature',
//                 message: undefined,
//                 messageCount: 0,
//                 subTopicCount: 0,
//                 children: [
//                   {
//                     id: 'test_connection_id-0-0-0',
//                     label: 'living-room',
//                     message: undefined,
//                     messageCount: 0,
//                     subTopicCount: 0,
//                     children: [],
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//         connectionInfo: connectionInfo,
//       },
//     ]

//     const fullPath = findFullTopicPath(tree, 'test_connection_id-0-0-0')
//     expect(fullPath).to.equal('sensors/temperature/living-room')
//   })

//   it('should get all IDs', () => {
//     const tree: TopicTreeNode[] = [
//       {
//         id: 'root',
//         label: 'root',
//         message: undefined,
//         messageCount: 0,
//         subTopicCount: 0,
//         children: [
//           { id: 'root-1', label: 'child1', message: undefined, messageCount: 0, subTopicCount: 0, children: [] },
//           {
//             id: 'root-2',
//             label: 'child2',
//             message: undefined,
//             messageCount: 0,
//             subTopicCount: 0,
//             children: [
//               {
//                 id: 'root-2-1',
//                 label: 'grandchild',
//                 message: undefined,
//                 messageCount: 0,
//                 subTopicCount: 0,
//                 children: [],
//               },
//             ],
//           },
//         ],
//       },
//     ]

//     const ids = getAllIDs(tree)
//     expect(ids).to.deep.equal(['root', 'root-1', 'root-2', 'root-2-1'])
//   })

//   it('should get all IDs for a complex tree', () => {
//     const tree: TopicTreeNode[] = [
//       {
//         id: 'test_connection_id',
//         label: 'root',
//         message: undefined,
//         messageCount: 0,
//         subTopicCount: 0,
//         children: [
//           {
//             id: 'test_connection_id-0',
//             label: 'child1',
//             message: undefined,
//             messageCount: 0,
//             subTopicCount: 0,
//             children: [
//               {
//                 id: 'test_connection_id-0-0',
//                 label: 'grandchild1',
//                 message: undefined,
//                 messageCount: 0,
//                 subTopicCount: 0,
//                 children: [],
//               },
//               {
//                 id: 'test_connection_id-0-1',
//                 label: 'grandchild2',
//                 message: undefined,
//                 messageCount: 0,
//                 subTopicCount: 0,
//                 children: [],
//               },
//             ],
//           },
//           {
//             id: 'test_connection_id-1',
//             label: 'child2',
//             message: undefined,
//             messageCount: 0,
//             subTopicCount: 0,
//             children: [
//               {
//                 id: 'test_connection_id-1-0',
//                 label: 'grandchild3',
//                 message: undefined,
//                 messageCount: 0,
//                 subTopicCount: 0,
//                 children: [],
//               },
//             ],
//           },
//         ],
//       },
//     ]

//     const ids = getAllIDs(tree)
//     expect(ids).to.deep.equal([
//       'test_connection_id',
//       'test_connection_id-0',
//       'test_connection_id-0-0',
//       'test_connection_id-0-1',
//       'test_connection_id-1',
//       'test_connection_id-1-0',
//     ])
//   })

//   it('should get all IDs for empty tree', () => {
//     const tree: TopicTreeNode[] = []

//     const ids = getAllIDs(tree)
//     expect(ids).to.deep.equal([])
//   })

//   it('should update existing tree node', () => {
//     const currentTree: TopicTreeNode[] = [
//       {
//         id: 'test_connection_id',
//         label: 'broker.emqx.io',
//         message: undefined,
//         messageCount: 0,
//         subTopicCount: 0,
//         children: [],
//         connectionInfo: connectionInfo,
//       },
//     ]
//     const packet: IPublishPacket = {
//       cmd: 'publish',
//       topic: 'sensors/temperature',
//       payload: Buffer.from('20.5'),
//       qos: 0,
//       dup: false,
//       retain: false,
//     }

//     const updatedTree = updateTopicTreeNode(currentTree, { packet, connectionInfo })

//     expect(updatedTree[0].messageCount).to.equal(1)
//     expect(updatedTree[0].children?.[0].id).to.equal('test_connection_id-0')
//     expect(updatedTree[0].children?.[0].label).to.equal('sensors')
//     expect(updatedTree[0].children?.[0].children?.[0].id).to.equal('test_connection_id-0-0')
//     expect(updatedTree[0].children?.[0].children?.[0].label).to.equal('temperature')
//     expect(updatedTree[0].children?.[0].children?.[0].message?.payload).to.equal('20.5')
//   })

//   it('should not update tree for non-publish packets', () => {
//     const currentTree: TopicTreeNode[] = []
//     const packet = { cmd: 'subscribe' } as any

//     const updatedTree = updateTopicTreeNode(currentTree, { packet, connectionInfo })

//     expect(updatedTree).to.deep.equal(currentTree)
//   })

//   it('should return null for non-existent topic path', () => {
//     const tree: TopicTreeNode[] = [
//       {
//         id: 'test_connection_id',
//         label: 'broker.emqx.io',
//         message: undefined,
//         messageCount: 0,
//         subTopicCount: 0,
//         children: [],
//         connectionInfo: connectionInfo,
//       },
//     ]

//     const fullPath = findFullTopicPath(tree, 'non-existent')
//     expect(fullPath).to.be.null
//   })

//   it('should correctly identify empty payloads', () => {
//     expect(isPayloadEmpty(null)).to.be.true
//     expect(isPayloadEmpty(undefined)).to.be.true
//     expect(isPayloadEmpty('')).to.be.false
//     expect(isPayloadEmpty('non-empty')).to.be.false
//     expect(isPayloadEmpty(Buffer.from(''))).to.be.false
//     expect(isPayloadEmpty(Buffer.from('non-empty'))).to.be.false
//   })
// })
