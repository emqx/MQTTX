import { expect } from 'chai'
import { formatBytes } from '@/utils/formatter'

describe('formatter.ts', () => {
  describe('formatBytes', () => {
    // Basic formatting tests
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

    // Decimal precision tests
    it('should handle decimal precision correctly', () => {
      // Standard decimal handling
      expect(formatBytes(1024 * 1024 * 1.333)).to.equal('1.33 MB')
      expect(formatBytes(1024 * 1024 * 1.337)).to.equal('1.34 MB')

      // Edge case decimal handling
      expect(formatBytes(1024.56)).to.equal('1 KB')
      expect(formatBytes(1024 * 1024 * 1.005)).to.equal('1 MB')
      expect(formatBytes(1024 * 1.995)).to.equal('2 KB')
    })

    // Special value handling tests
    it('should handle special values correctly', () => {
      // Invalid inputs
      expect(formatBytes(NaN)).to.equal('0 B')
      expect(formatBytes(Infinity)).to.equal('0 B')
      expect(formatBytes(-Infinity)).to.equal('0 B')
      expect(formatBytes(undefined as any)).to.equal('0 B')
      expect(formatBytes(null as any)).to.equal('0 B')

      // Negative values
      expect(formatBytes(-1)).to.equal('0 B')
      expect(formatBytes(-1024)).to.equal('0 B')
      expect(formatBytes(-0.1)).to.equal('0 B')

      // Very small values
      expect(formatBytes(0.1)).to.equal('0.1 B')
      expect(formatBytes(0.01)).to.equal('0.01 B')
      expect(formatBytes(0.001)).to.equal('0 B')

      // Very large values
      const hugeNumber = Math.pow(1024, 5) // Larger than TB
      expect(formatBytes(hugeNumber)).to.equal('∞ TB')
    })
  })
})
