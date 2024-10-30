import { expect } from 'chai'
import * as SystemTopicUtils from '@/utils/SystemTopicUtils'
import time from '@/utils/time'

describe('SystemTopicUtils', () => {
  let originalGetNowDate: () => string

  beforeEach(() => {
    originalGetNowDate = time.getNowDate
    time.getNowDate = () => '2023-01-01 00:00:00'
  })

  afterEach(() => {
    time.getNowDate = originalGetNowDate
  })

  describe('isSystemTopic', () => {
    it('should return true for system topics', () => {
      expect(SystemTopicUtils.isSystemTopic('$SYS/broker/bytes/received')).to.be.true
    })

    it('should return false for non-system topics', () => {
      expect(SystemTopicUtils.isSystemTopic('/metrics/bytes/received')).to.be.false
    })
  })

  describe('extractData', () => {
    it('should extract data when topic matches', () => {
      const message = { topic: '/metrics/bytes/received', payload: '100' }
      expect(SystemTopicUtils.extractData(message as MessageModel, '/metrics/bytes/received')).to.equal('100')
    })

    it('should return null when topic does not match', () => {
      const message = { topic: '/other/topic', payload: '100' }
      expect(SystemTopicUtils.extractData(message as MessageModel, '/metrics/bytes/received')).to.be.null
    })
  })

  describe('getTrafficMetrics', () => {
    it('should return null for system topics', () => {
      const message = { topic: '$SYS/broker/bytes/received', payload: '100' }
      const result = SystemTopicUtils.getTrafficMetrics(message as MessageModel)
      expect(result).to.be.null
    })

    it('should return metrics for received bytes', () => {
      const message = { topic: '/metrics/bytes/received', payload: '100' }
      const result = SystemTopicUtils.getTrafficMetrics(message as MessageModel)
      expect(result).to.deep.equal({
        label: '2023-01-01 00:00:00',
        recevied: 100,
        sent: 0,
      })
    })

    it('should return metrics for sent bytes', () => {
      const message = { topic: '/metrics/bytes/sent', payload: '200' }
      const result = SystemTopicUtils.getTrafficMetrics(message as MessageModel)
      expect(result).to.deep.equal({
        label: '2023-01-01 00:00:00',
        recevied: 0,
        sent: 200,
      })
    })

    it('should return null for unrelated topics', () => {
      const message = { topic: '/other/topic', payload: '300' }
      const result = SystemTopicUtils.getTrafficMetrics(message as MessageModel)
      expect(result).to.be.null
    })
  })

  describe('getUptime', () => {
    it('should return uptime data', () => {
      const message = { topic: '/uptime', payload: '1000' }
      const result = SystemTopicUtils.getUptime(message as MessageModel)
      expect(result).to.equal('1000')
    })

    it('should return null for unrelated topics', () => {
      const message = { topic: '/other/topic', payload: '1000' }
      const result = SystemTopicUtils.getUptime(message as MessageModel)
      expect(result).to.be.null
    })
  })

  describe('getVersion', () => {
    it('should return version data', () => {
      const message = { topic: '/version', payload: '1.0.0' }
      const result = SystemTopicUtils.getVersion(message as MessageModel)
      expect(result).to.equal('1.0.0')
    })

    it('should return null for unrelated topics', () => {
      const message = { topic: '/other/topic', payload: '1.0.0' }
      const result = SystemTopicUtils.getVersion(message as MessageModel)
      expect(result).to.be.null
    })
  })
})
