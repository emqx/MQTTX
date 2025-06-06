import { parsePayloadSize, generateRandomPayload } from '../../utils/payloadGenerator'
import { MQTT_SINGLE_MESSAGE_BYTE_LIMIT } from '../../utils/constants'
import { expect, describe, it } from '@jest/globals'

describe('parsePayloadSize function', () => {
  describe('valid input cases', () => {
    it('should parse bytes correctly', () => {
      expect(parsePayloadSize('1024B')).toBe(1024)
      expect(parsePayloadSize('512b')).toBe(512)
      expect(parsePayloadSize('1B')).toBe(1)
      expect(parsePayloadSize('0B')).toBe(0)
    })

    it('should parse bytes without B suffix', () => {
      expect(parsePayloadSize('1024')).toBe(1024)
      expect(parsePayloadSize('512')).toBe(512)
      expect(parsePayloadSize('1')).toBe(1)
      expect(parsePayloadSize('0')).toBe(0)
    })

    it('should parse KB correctly', () => {
      expect(parsePayloadSize('1KB')).toBe(1024)
      expect(parsePayloadSize('2kb')).toBe(2048)
      expect(parsePayloadSize('1.5KB')).toBe(1536)
      expect(parsePayloadSize('0.5K')).toBe(512)
    })

    it('should parse MB correctly', () => {
      expect(parsePayloadSize('1MB')).toBe(1024 * 1024)
      expect(parsePayloadSize('2mb')).toBe(2 * 1024 * 1024)
      expect(parsePayloadSize('1.5MB')).toBe(Math.round(1.5 * 1024 * 1024))
      expect(parsePayloadSize('0.5M')).toBe(512 * 1024)
    })

    it('should parse GB correctly', () => {
      expect(parsePayloadSize('1GB')).toBe(1024 * 1024 * 1024)
      expect(parsePayloadSize('2gb')).toBe(2 * 1024 * 1024 * 1024)
      expect(parsePayloadSize('0.5GB')).toBe(Math.round(0.5 * 1024 * 1024 * 1024))
      expect(parsePayloadSize('1.25G')).toBe(Math.round(1.25 * 1024 * 1024 * 1024))
    })

    it('should handle decimal values correctly', () => {
      expect(parsePayloadSize('1.5KB')).toBe(1536)
      expect(parsePayloadSize('2.25MB')).toBe(Math.round(2.25 * 1024 * 1024))
      expect(parsePayloadSize('0.75GB')).toBe(Math.round(0.75 * 1024 * 1024 * 1024))
    })
  })

  describe('invalid input cases', () => {
    it('should throw error for empty or null input', () => {
      expect(() => parsePayloadSize('')).toThrow('Payload size string must be a non-empty string.')
      expect(() => parsePayloadSize(null as any)).toThrow('Payload size string must be a non-empty string.')
      expect(() => parsePayloadSize(undefined as any)).toThrow('Payload size string must be a non-empty string.')
    })

    it('should throw error for invalid format', () => {
      expect(() => parsePayloadSize('abc')).toThrow('Invalid size format: "abc". Use formats like 1024B, 1KB, 2.5MB.')
      expect(() => parsePayloadSize('1.2.3KB')).toThrow(
        'Invalid size format: "1.2.3KB". Use formats like 1024B, 1KB, 2.5MB.',
      )
      expect(() => parsePayloadSize('KB1')).toThrow('Invalid size format: "KB1". Use formats like 1024B, 1KB, 2.5MB.')
      expect(() => parsePayloadSize('-1KB')).toThrow('Invalid size format: "-1KB". Use formats like 1024B, 1KB, 2.5MB.')
    })

    it('should throw error for unsupported units', () => {
      expect(() => parsePayloadSize('1TB')).toThrow('Invalid size format: "1TB". Use formats like 1024B, 1KB, 2.5MB.')
      expect(() => parsePayloadSize('1PB')).toThrow('Invalid size format: "1PB". Use formats like 1024B, 1KB, 2.5MB.')
      expect(() => parsePayloadSize('1XB')).toThrow('Invalid size format: "1XB". Use formats like 1024B, 1KB, 2.5MB.')
    })

    it('should throw error for non-string input', () => {
      expect(() => parsePayloadSize(123 as any)).toThrow('Payload size string must be a non-empty string.')
      expect(() => parsePayloadSize({} as any)).toThrow('Payload size string must be a non-empty string.')
      expect(() => parsePayloadSize([] as any)).toThrow('Payload size string must be a non-empty string.')
    })
  })

  describe('case insensitivity', () => {
    it('should handle different cases correctly', () => {
      expect(parsePayloadSize('1kb')).toBe(1024)
      expect(parsePayloadSize('1KB')).toBe(1024)
      expect(parsePayloadSize('1Kb')).toBe(1024)
      expect(parsePayloadSize('1kB')).toBe(1024)

      expect(parsePayloadSize('1mb')).toBe(1024 * 1024)
      expect(parsePayloadSize('1MB')).toBe(1024 * 1024)
      expect(parsePayloadSize('1Mb')).toBe(1024 * 1024)
      expect(parsePayloadSize('1mB')).toBe(1024 * 1024)
    })
  })
})

describe('generateRandomPayload function', () => {
  describe('valid input cases', () => {
    it('should generate buffer of correct size', () => {
      const payload = generateRandomPayload(100)
      expect(payload).toBeInstanceOf(Buffer)
      expect(payload.length).toBe(100)
    })

    it('should generate empty buffer for size 0', () => {
      const payload = generateRandomPayload(0)
      expect(payload).toBeInstanceOf(Buffer)
      expect(payload.length).toBe(0)
    })

    it('should generate different random data for each call', () => {
      const payload1 = generateRandomPayload(100)
      const payload2 = generateRandomPayload(100)

      expect(payload1).toBeInstanceOf(Buffer)
      expect(payload2).toBeInstanceOf(Buffer)
      expect(payload1.length).toBe(100)
      expect(payload2.length).toBe(100)
      expect(payload1.equals(payload2)).toBe(false) // Should be different random data
    })

    it('should handle large but valid sizes', () => {
      const largeSize = 1024 * 1024 // 1MB
      const payload = generateRandomPayload(largeSize)
      expect(payload).toBeInstanceOf(Buffer)
      expect(payload.length).toBe(largeSize)
    })

    it('should handle maximum allowed size', () => {
      const payload = generateRandomPayload(MQTT_SINGLE_MESSAGE_BYTE_LIMIT)
      expect(payload).toBeInstanceOf(Buffer)
      expect(payload.length).toBe(MQTT_SINGLE_MESSAGE_BYTE_LIMIT)
    })
  })

  describe('invalid input cases', () => {
    it('should throw error for negative size', () => {
      expect(() => generateRandomPayload(-1)).toThrow('Payload size cannot be negative.')
      expect(() => generateRandomPayload(-100)).toThrow('Payload size cannot be negative.')
    })

    it('should throw error for size exceeding MQTT limit', () => {
      const oversizedPayload = MQTT_SINGLE_MESSAGE_BYTE_LIMIT + 1
      expect(() => generateRandomPayload(oversizedPayload)).toThrow(
        `Requested payload size (${oversizedPayload} bytes) exceeds MQTT's maximum limit of 256MB.`,
      )
    })

    it('should throw error for very large sizes', () => {
      const veryLargeSize = MQTT_SINGLE_MESSAGE_BYTE_LIMIT * 2
      expect(() => generateRandomPayload(veryLargeSize)).toThrow(
        `Requested payload size (${veryLargeSize} bytes) exceeds MQTT's maximum limit of 256MB.`,
      )
    })
  })

  describe('edge cases', () => {
    it('should handle size at the boundary of MQTT limit', () => {
      const payload = generateRandomPayload(MQTT_SINGLE_MESSAGE_BYTE_LIMIT)
      expect(payload).toBeInstanceOf(Buffer)
      expect(payload.length).toBe(MQTT_SINGLE_MESSAGE_BYTE_LIMIT)
    })

    it('should handle small sizes', () => {
      for (let i = 1; i <= 10; i++) {
        const payload = generateRandomPayload(i)
        expect(payload).toBeInstanceOf(Buffer)
        expect(payload.length).toBe(i)
      }
    })
  })

  describe('data randomness', () => {
    it('should generate random data (not all zeros)', () => {
      const payload = generateRandomPayload(100)
      const allZeros = Buffer.alloc(100, 0)
      expect(payload.equals(allZeros)).toBe(false)
    })

    it('should generate different data each time', () => {
      const payloads: Buffer[] = []
      for (let i = 0; i < 5; i++) {
        payloads.push(generateRandomPayload(50))
      }

      // Check that not all payloads are identical
      const allIdentical = payloads.every((payload) => payload.equals(payloads[0]))
      expect(allIdentical).toBe(false)
    })
  })
})
