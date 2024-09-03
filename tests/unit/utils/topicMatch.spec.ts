import { expect } from 'chai'
import topicMatch, { matchTopicMethod } from '@/utils/topicMatch'

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

    it('should handle shared subscriptions', () => {
      expect(matchTopicMethod('$share/group/a/+/c', 'a/b/c')).to.be.true
      expect(matchTopicMethod('$share/group/a/#', 'a/b/c/d')).to.be.true
    })
  })

  describe('topicMatch', () => {
    const createMessage = (topic: string, payload: string): MessageModel => ({
      topic,
      payload,
      createAt: new Date().toISOString(),
      out: false,
      qos: 0,
      retain: false,
    })

    it('should filter messages based on topic', async () => {
      const messages = [createMessage('a/b/c', '1'), createMessage('a/d/c', '2'), createMessage('x/y/z', '3')]

      const result = await topicMatch(messages, 'a/+/c')
      expect(result).to.have.lengthOf(2)
      expect(result[0].payload).to.equal('1')
      expect(result[1].payload).to.equal('2')
    })

    it('should return an empty array if no matches', async () => {
      const messages = [createMessage('a/b/c', '1'), createMessage('a/d/c', '2')]

      const result = await topicMatch(messages, 'x/y/z')
      expect(result).to.be.an('array').that.is.empty
    })

    it('should handle multi-level wildcards correctly', async () => {
      const messages = [createMessage('a/b/c', '1'), createMessage('a/d/e/f', '2'), createMessage('x/y/z', '3')]

      const result = await topicMatch(messages, 'a/#')
      expect(result).to.have.lengthOf(2)
      expect(result[0].payload).to.equal('1')
      expect(result[1].payload).to.equal('2')
    })

    it('should handle shared subscriptions', async () => {
      const messages = [createMessage('a/b/c', '1'), createMessage('a/d/e', '2')]

      const result = await topicMatch(messages, '$share/group/a/+/c')
      expect(result).to.have.lengthOf(1)
      expect(result[0].payload).to.equal('1')
    })
  })
})
