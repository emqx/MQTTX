import '../mocks/browserStorage'
import { expect } from 'chai'
import ConnectionsDetail from '@/views/connections/ConnectionsDetail.vue'

const methods = (ConnectionsDetail as any).options.methods
const messages = [
  { topic: 'a/temp', payload: '1', out: false },
  { topic: 'b/temp', payload: '2', out: false },
  { topic: 'a/temp', payload: '3', out: true },
  { topic: 'a/humidity', payload: '4', out: false },
]
const context = () => ({
  ...methods,
  activeTopic: 'a/#',
  msgType: 'received',
  searchVisible: true,
  searchTopic: 'temp',
  messageQueryVersion: 0,
  record: { messages },
  messages: [],
})

describe('Web topic filter transitions', () => {
  it('combines topic, search and message type', async () => {
    const vm = context()
    await vm.getMessages()
    expect(vm.messages).to.deep.equal([messages[0]])
  })
  it('clearing the topic preserves search and message type', async () => {
    const vm = context()
    await vm.clearTopicFilter()
    expect(vm.activeTopic).to.equal('')
    expect(vm.msgType).to.equal('received')
    expect(vm.searchTopic).to.equal('temp')
    expect(vm.messages).to.deep.equal([messages[0], messages[1]])
  })
  it('closing search preserves the selected topic', async () => {
    const vm = context()
    vm.handleSearchClose()
    await Promise.resolve()
    expect(vm.activeTopic).to.equal('a/#')
    expect(vm.searchTopic).to.equal('')
    expect(vm.messages).to.deep.equal([messages[0], messages[3]])
  })
  it('switching connections clears the filter and invalidates old results', () => {
    const vm = context()
    vm.resetTopicFilter()
    expect(vm.activeTopic).to.equal('')
    expect(vm.messageQueryVersion).to.equal(1)
  })
  it('deleting a different subscription preserves the filter', async () => {
    const vm = { ...context(), scrollToBottom: () => {} }
    vm.handleTopicDelete('b/#')
    await Promise.resolve()
    expect(vm.activeTopic).to.equal('a/#')
    expect(vm.messages).to.deep.equal([messages[0]])
    vm.handleTopicDelete('a/#')
    await Promise.resolve()
    expect(vm.activeTopic).to.equal('')
    expect(vm.messages).to.deep.equal([messages[0], messages[1]])
  })
  it('does not apply results from a previous filter after it is cleared', async () => {
    const vm = context()
    const oldResult = vm.getMessages()
    const clearedResult = vm.clearTopicFilter()
    await Promise.all([oldResult, clearedResult])
    expect(vm.messages).to.deep.equal([messages[0], messages[1]])
  })
})
