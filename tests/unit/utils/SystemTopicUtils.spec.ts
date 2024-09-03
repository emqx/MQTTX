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

  describe('getBytes', () => {
    it('should return chart data for received bytes', () => {
      const message = { topic: '/metrics/bytes/received', payload: '100' }
      const result = SystemTopicUtils.getBytes(message as MessageModel)
      expect(result).to.deep.equal({
        label: '2023-01-01 00:00:00',
        recevied: 100,
        sent: 0,
      })
    })

    it('should return chart data for sent bytes', () => {
      const message = { topic: '/metrics/bytes/sent', payload: '200' }
      const result = SystemTopicUtils.getBytes(message as MessageModel)
      expect(result).to.deep.equal({
        label: '2023-01-01 00:00:00',
        recevied: 100,
        sent: 200,
      })
    })

    it('should return null for unrelated topics', () => {
      const message = { topic: '/other/topic', payload: '300' }
      const result = SystemTopicUtils.getBytes(message as MessageModel)
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
