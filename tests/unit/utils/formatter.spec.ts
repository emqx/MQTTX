import { expect } from 'chai'
import { formatBytes } from '@/utils/formatter'

describe('formatter.ts', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatBytes(0)).to.equal('0 B')
    })

    it('should format bytes (< 1024) correctly', () => {
      expect(formatBytes(100)).to.equal('100 B')
      expect(formatBytes(1023)).to.equal('1023 B')
    })

    it('should format kilobytes correctly', () => {
      expect(formatBytes(1024)).to.equal('1 KB')
      expect(formatBytes(1536)).to.equal('1.5 KB')
      expect(formatBytes(1024 * 1023)).to.equal('1023 KB')
    })

    it('should format megabytes correctly', () => {
      expect(formatBytes(1024 * 1024)).to.equal('1 MB')
      expect(formatBytes(1024 * 1024 * 1.5)).to.equal('1.5 MB')
      expect(formatBytes(1024 * 1024 * 1023)).to.equal('1023 MB')
    })

    it('should format gigabytes correctly', () => {
      expect(formatBytes(1024 * 1024 * 1024)).to.equal('1 GB')
      expect(formatBytes(1024 * 1024 * 1024 * 2.5)).to.equal('2.5 GB')
    })

    it('should format terabytes correctly', () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).to.equal('1 TB')
      expect(formatBytes(1024 * 1024 * 1024 * 1024 * 3.25)).to.equal('3.25 TB')
    })

    it('should handle decimal places correctly', () => {
      expect(formatBytes(1024 * 1024 * 1.333)).to.equal('1.33 MB')
      expect(formatBytes(1024 * 1024 * 1.337)).to.equal('1.34 MB')
    })

    it('should handle negative values', () => {
      expect(formatBytes(-1024)).to.equal('0 B')
    })

    it('should handle non-number inputs', () => {
      expect(formatBytes(NaN)).to.equal('0 B')
      expect(formatBytes(Infinity)).to.equal('0 B')
    })
  })
})
