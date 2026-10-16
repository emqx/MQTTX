import { expect } from 'chai'
import { matchTopicMethod } from '@/utils/topicMatch'

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
})
