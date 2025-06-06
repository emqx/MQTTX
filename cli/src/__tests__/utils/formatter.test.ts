import { formatBytes } from '../../utils/formatter'
import { expect, describe, it } from '@jest/globals'

describe('formatBytes function', () => {
  it('should return "0B" for zero bytes', () => {
    expect(formatBytes(0)).toBe('0B')
  })

  it('should return "0B" for negative numbers', () => {
    expect(formatBytes(-1)).toBe('0B')
    expect(formatBytes(-100)).toBe('0B')
  })

  it('should return "0B" for NaN', () => {
    expect(formatBytes(NaN)).toBe('0B')
  })

  it('should return "0B" for Infinity', () => {
    expect(formatBytes(Infinity)).toBe('0B')
    expect(formatBytes(-Infinity)).toBe('0B')
  })

  it('should format bytes less than 1 with decimals', () => {
    expect(formatBytes(0.5)).toBe('0.5B')
    expect(formatBytes(0.25)).toBe('0.25B')
    expect(formatBytes(0.123)).toBe('0.12B')
  })

  it('should format bytes without decimals for whole numbers', () => {
    expect(formatBytes(1)).toBe('1B')
    expect(formatBytes(512)).toBe('512B')
    expect(formatBytes(1023)).toBe('1023B')
  })

  it('should format KB correctly', () => {
    expect(formatBytes(1024)).toBe('1KB')
    expect(formatBytes(2048)).toBe('2KB')
    expect(formatBytes(1536)).toBe('1.5KB')
    expect(formatBytes(1587.2)).toBe('1.55KB')
  })

  it('should format MB correctly', () => {
    expect(formatBytes(1024 * 1024)).toBe('1MB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2MB')
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5MB')
    expect(formatBytes(2.54 * 1024 * 1024)).toBe('2.54MB')
  })

  it('should format GB correctly', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1GB')
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2GB')
    expect(formatBytes(1.25 * 1024 * 1024 * 1024)).toBe('1.25GB')
  })

  it('should format TB correctly', () => {
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1TB')
    expect(formatBytes(2 * 1024 * 1024 * 1024 * 1024)).toBe('2TB')
    expect(formatBytes(1.5 * 1024 * 1024 * 1024 * 1024)).toBe('1.5TB')
  })

  it('should return "∞TB" for extremely large numbers', () => {
    const hugeNumber = Math.pow(1024, 10) // Much larger than TB
    expect(formatBytes(hugeNumber)).toBe('∞TB')
  })

  it('should handle decimal rounding correctly', () => {
    // Test cases where decimal should be shown
    expect(formatBytes(1536)).toBe('1.5KB')
    expect(formatBytes(1587.2)).toBe('1.55KB')

    // Test cases where decimal should not be shown (very small decimal)
    expect(formatBytes(1024.001)).toBe('1KB')
  })

  it('should format various realistic file sizes', () => {
    expect(formatBytes(0)).toBe('0B')
    expect(formatBytes(1)).toBe('1B')
    expect(formatBytes(1024)).toBe('1KB')
    expect(formatBytes(1024 * 1024)).toBe('1MB')
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1GB')
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1TB')
  })

  it('should handle edge cases near unit boundaries', () => {
    expect(formatBytes(1023)).toBe('1023B')
    expect(formatBytes(1025)).toBe('1KB')
    expect(formatBytes(1024 * 1024 - 1)).toBe('1024KB')
    expect(formatBytes(1024 * 1024 + 1)).toBe('1MB')
  })
})
