import { expect } from 'chai'
import { matchTopicMethod } from '@/utils/topicMatch'

describe('topicMatch utility', () => {
  describe('matchTopicMethod', () => {
    it('should match exact topics', () => {
      expect(matchTopicMethod('a/b/c', 'a/b/c')).to.be.true
    })

    it('should not match different topics', () => {
      expect(matchTopicMethod('a/b/c', 'a/b/d')).to.be.false
    })

    it('should match single-level wildcard', () => {
      expect(matchTopicMethod('a/+/c', 'a/b/c')).to.be.true
      expect(matchTopicMethod('a/+/c', 'a/d/c')).to.be.true
      expect(matchTopicMethod('a/+/c', 'a/b/d')).to.be.false
    })

    it('should match multi-level wildcard', () => {
      expect(matchTopicMethod('a/#', 'a/b/c')).to.be.true
      expect(matchTopicMethod('a/#', 'a/d/e/f')).to.be.true
      expect(matchTopicMethod('a/#', 'b/c/d')).to.be.false
    })

    it('keeps root wildcards out of system topics', () => {
      expect(matchTopicMethod('#', '$SYS/broker/uptime')).to.be.false
      expect(matchTopicMethod('+/broker/+', '$SYS/broker/uptime')).to.be.false
      expect(matchTopicMethod('$SYS/#', '$SYS/broker/uptime')).to.be.true
      expect(matchTopicMethod('$share/group/#', '$SYS/broker/uptime')).to.be.false
    })

    it('only strips the actual shared-subscription prefix', () => {
      expect(matchTopicMethod('$shareable/topic', '$shareable/topic')).to.be.true
    })

    it('should handle shared subscriptions', () => {
      expect(matchTopicMethod('$share/group/a/+/c', 'a/b/c')).to.be.true
      expect(matchTopicMethod('$share/group/a/#', 'a/b/c/d')).to.be.true
    })
  })
})
