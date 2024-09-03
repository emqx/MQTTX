import { expect } from 'chai'
import {
  getClientId,
  getCollectionId,
  getSubscriptionId,
  getMessageId,
  getCopilotMessageId,
  ENCRYPT_KEY,
} from '@/utils/idGenerator'

describe('idGenerator', () => {
  describe('getClientId', () => {
    it('should return a string starting with "mqttx_"', () => {
      const clientId = getClientId()
      expect(clientId).to.be.a('string')
      expect(clientId).to.match(/^mqttx_[a-f0-9]{8}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 1000; i++) {
        ids.add(getClientId())
      }
      expect(ids.size).to.equal(1000)
    })
  })

  describe('getCollectionId', () => {
    it('should return a string starting with "collection_"', () => {
      const collectionId = getCollectionId()
      expect(collectionId).to.be.a('string')
      expect(collectionId).to.match(/^collection_[a-f0-9-]{36}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 1000; i++) {
        ids.add(getCollectionId())
      }
      expect(ids.size).to.equal(1000)
    })
  })

  describe('getSubscriptionId', () => {
    it('should return a string starting with "scription_"', () => {
      const subscriptionId = getSubscriptionId()
      expect(subscriptionId).to.be.a('string')
      expect(subscriptionId).to.match(/^scription_[a-f0-9-]{36}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 1000; i++) {
        ids.add(getSubscriptionId())
      }
      expect(ids.size).to.equal(1000)
    })
  })

  describe('getMessageId', () => {
    it('should return a string starting with "message_"', () => {
      const messageId = getMessageId()
      expect(messageId).to.be.a('string')
      expect(messageId).to.match(/^message_[a-f0-9-]{36}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 1000; i++) {
        ids.add(getMessageId())
      }
      expect(ids.size).to.equal(1000)
    })
  })

  describe('getCopilotMessageId', () => {
    it('should return a string starting with "copilot_"', () => {
      const copilotMessageId = getCopilotMessageId()
      expect(copilotMessageId).to.be.a('string')
      expect(copilotMessageId).to.match(/^copilot_[a-f0-9-]{36}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 1000; i++) {
        ids.add(getCopilotMessageId())
      }
      expect(ids.size).to.equal(1000)
    })
  })

  describe('ENCRYPT_KEY', () => {
    it('should be a base64 encoded string', () => {
      expect(ENCRYPT_KEY).to.be.a('string')
      expect(Buffer.from(ENCRYPT_KEY, 'base64').toString('base64')).to.equal(ENCRYPT_KEY)
    })

    it('should have the correct value', () => {
      const expectedValue = Buffer.from('123e4567-e89b-12d3-a456-426614174000').toString('base64')
      expect(ENCRYPT_KEY).to.equal(expectedValue)
    })
  })
})
