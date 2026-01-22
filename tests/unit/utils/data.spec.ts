import { expect } from 'chai'
import { isLargeData, calculateTextSize, DEFAULT_MAX_PAYLOAD_DISPLAY_SIZE, SHOW_MAX_LENGTH } from '@/utils/data'

describe('data utility functions', () => {
  describe('DEFAULT_MAX_PAYLOAD_DISPLAY_SIZE', () => {
    it('should be 524288', () => {
      expect(DEFAULT_MAX_PAYLOAD_DISPLAY_SIZE).to.equal(524288)
    })
  })

  describe('SHOW_MAX_LENGTH', () => {
    it('should be 100', () => {
      expect(SHOW_MAX_LENGTH).to.equal(100)
    })
  })

  describe('isLargeData', () => {
    it('should return false for small data', () => {
      const smallData = 'a'.repeat(DEFAULT_MAX_PAYLOAD_DISPLAY_SIZE - 1)
      expect(isLargeData(smallData)).to.be.false
    })

    it('should return true for large data', () => {
      const largeData = 'a'.repeat(DEFAULT_MAX_PAYLOAD_DISPLAY_SIZE + 1)
      expect(isLargeData(largeData)).to.be.true
    })

    it('should return true for data exactly at threshold', () => {
      const thresholdData = 'a'.repeat(DEFAULT_MAX_PAYLOAD_DISPLAY_SIZE)
      expect(isLargeData(thresholdData)).to.be.true
    })
  })

  describe('calculateTextSize', () => {
    it('should return "0 Bytes" for empty string', () => {
      expect(calculateTextSize('')).to.equal('0 Bytes')
    })

    it('should calculate size in Bytes', () => {
      expect(calculateTextSize('Hello')).to.equal('5 Bytes')
    })

    it('should calculate size in KB', () => {
      const kilobyteString = 'a'.repeat(1024)
      expect(calculateTextSize(kilobyteString)).to.equal('1 KB')
    })

    it('should calculate size in MB', () => {
      const megabyteString = 'a'.repeat(1024 * 1024)
      expect(calculateTextSize(megabyteString)).to.equal('1 MB')
    })

    it('should use specified number of decimal places', () => {
      const string = 'a'.repeat(1500)
      expect(calculateTextSize(string, 3)).to.equal('1.465 KB')
    })
  })
})
