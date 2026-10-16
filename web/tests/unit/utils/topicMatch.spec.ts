import { expect } from 'chai'
import topicMatch, { matchTopicMethod } from '@/utils/topicMatch'

describe('Web topic matching', () => {
  it('excludes system topics from root wildcards, including shared subscriptions', () => {
    for (const filter of ['#', '+/broker/+', '$share/group/#']) {
      expect(matchTopicMethod(filter, '$SYS/broker/uptime'), filter).to.be.false
    }
    expect(matchTopicMethod('$SYS/#', '$SYS/broker/uptime')).to.be.true
    expect(matchTopicMethod('$share/group/$SYS/#', '$SYS/broker/uptime')).to.be.true
  })

  it('strips only the actual shared-subscription prefix', () => {
    for (const topic of ['$shareable/topic', 'factory/$share/topic']) {
      expect(matchTopicMethod(topic, topic), topic).to.be.true
    }
    expect(matchTopicMethod('$share/group/a/+', 'a/b')).to.be.true
  })

  const messages: MessageModel[] = ['a/b', '$SYS/broker/uptime', '$shareable/topic'].map((topic) => ({
    topic,
    payload: 'reading',
    createAt: '2026-01-01T00:00:00.000Z',
    out: false,
    qos: 0,
    retain: false,
  }))

  it('excludes system topics when filtering stored messages by #', async () => {
    const result = await topicMatch(messages, '#')
    expect(result.map((message) => message.topic)).to.deep.equal(['a/b'])
  })

  it('keeps stored messages whose literal topic contains the shared marker', async () => {
    const result = await topicMatch(messages, '$shareable/topic')
    expect(result.map((message) => message.topic)).to.deep.equal(['$shareable/topic'])
  })
})
