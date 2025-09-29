/// <reference types="../../types/global" />

import { ScramAuth, ScramAlgorithm } from '../../utils/scramAuth'
import { expect, describe, it, jest, beforeEach } from '@jest/globals'
import * as crypto from 'crypto'

// Mock crypto.randomBytes to make tests deterministic
jest.mock('crypto', () => ({
  ...jest.requireActual<typeof crypto>('crypto'),
  randomBytes: jest.fn(),
}))

const mockedCrypto = crypto as jest.Mocked<typeof crypto>

describe('ScramAuth', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    // Mock randomBytes to return a predictable value that will create the client nonce 'fyko+d2lbbFgONRv9qkxdawL'
    mockedCrypto.randomBytes.mockImplementation(() => Buffer.from('fyko+d2lbbFgONRv9qkxdawL', 'base64'))
  })

  describe('constructor', () => {
    it('should create ScramAuth instance with default algorithm', () => {
      const scramAuth = new ScramAuth('testuser', 'testpass')
      expect(scramAuth).toBeInstanceOf(ScramAuth)
    })

    it('should create ScramAuth instance with specified algorithm', () => {
      const scramAuth = new ScramAuth('testuser', 'testpass', 'SCRAM-SHA-1')
      expect(scramAuth).toBeInstanceOf(ScramAuth)
    })

    it('should generate client nonce on construction', () => {
      new ScramAuth('testuser', 'testpass')
      expect(mockedCrypto.randomBytes).toHaveBeenCalledWith(32)
    })
  })

  describe('getHashFunction', () => {
    it('should return correct hash function for SCRAM-SHA-1', () => {
      const scramAuth = new ScramAuth('testuser', 'testpass', 'SCRAM-SHA-1')
      const firstMessage = scramAuth.clientFirst()
      expect(firstMessage).toBeInstanceOf(Buffer)
    })

    it('should return correct hash function for SCRAM-SHA-256', () => {
      const scramAuth = new ScramAuth('testuser', 'testpass', 'SCRAM-SHA-256')
      const firstMessage = scramAuth.clientFirst()
      expect(firstMessage).toBeInstanceOf(Buffer)
    })

    it('should return correct hash function for SCRAM-SHA-512', () => {
      const scramAuth = new ScramAuth('testuser', 'testpass', 'SCRAM-SHA-512')
      const firstMessage = scramAuth.clientFirst()
      expect(firstMessage).toBeInstanceOf(Buffer)
    })

    it('should throw error for unsupported algorithm', () => {
      expect(() => {
        const scramAuth = new ScramAuth('testuser', 'testpass', 'INVALID-ALGORITHM' as ScramAlgorithm)
        scramAuth.clientFirst()
        const serverFirstMessage = Buffer.from('r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096')
        scramAuth.clientFinal(serverFirstMessage)
      }).toThrow('Unsupported algorithm: INVALID-ALGORITHM')
    })
  })

  describe('saslPrep', () => {
    it('should escape = and , characters in username', () => {
      const scramAuth = new ScramAuth('test=user,name', 'testpass')
      const firstMessage = scramAuth.clientFirst()
      const messageStr = firstMessage.toString()
      expect(messageStr).toContain('n=test=3Duser=2Cname')
    })
  })

  describe('clientFirst', () => {
    it('should generate client first message with correct format', () => {
      const scramAuth = new ScramAuth('testuser', 'testpass')
      const firstMessage = scramAuth.clientFirst()
      const messageStr = firstMessage.toString()

      expect(messageStr).toMatch(/^n,,n=testuser,r=.+/)
      expect(messageStr).toContain('n=testuser')
    })

    it('should handle special characters in username', () => {
      const scramAuth = new ScramAuth('test=user,name', 'testpass')
      const firstMessage = scramAuth.clientFirst()
      const messageStr = firstMessage.toString()

      expect(messageStr).toContain('n=test=3Duser=2Cname')
    })

    it('should return buffer', () => {
      const scramAuth = new ScramAuth('testuser', 'testpass')
      const firstMessage = scramAuth.clientFirst()
      expect(firstMessage).toBeInstanceOf(Buffer)
    })
  })

  describe('clientFinal', () => {
    let scramAuth: ScramAuth

    beforeEach(() => {
      scramAuth = new ScramAuth('user', 'pencil', 'SCRAM-SHA-1')
      scramAuth.clientFirst()
    })

    it('should generate client final message for valid server response', () => {
      const serverFirstMessage = Buffer.from('r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096')

      const clientFinal = scramAuth.clientFinal(serverFirstMessage)
      expect(clientFinal).toBeInstanceOf(Buffer)

      const finalStr = clientFinal.toString()
      expect(finalStr).toMatch(/^c=biws,r=.+,p=.+/)
    })

    it('should throw error for invalid server nonce', () => {
      const serverFirstMessage = Buffer.from('r=invalid-nonce,s=QSXCR+Q6sek8bf92,i=4096')

      expect(() => {
        scramAuth.clientFinal(serverFirstMessage)
      }).toThrow('Invalid server nonce')
    })

    it('should parse server parameters correctly', () => {
      const serverFirstMessage = Buffer.from('r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096')

      expect(() => {
        scramAuth.clientFinal(serverFirstMessage)
      }).not.toThrow()
    })

    it('should handle malformed server message gracefully', () => {
      const serverFirstMessage = Buffer.from('invalid=message=format')

      expect(() => {
        scramAuth.clientFinal(serverFirstMessage)
      }).toThrow()
    })
  })

  describe('algorithm-specific behavior', () => {
    const testCases: Array<{ algorithm: ScramAlgorithm; expectedLength: number }> = [
      { algorithm: 'SCRAM-SHA-1', expectedLength: 20 },
      { algorithm: 'SCRAM-SHA-256', expectedLength: 32 },
      { algorithm: 'SCRAM-SHA-512', expectedLength: 64 },
    ]

    testCases.forEach(({ algorithm }) => {
      it(`should work correctly with ${algorithm}`, () => {
        const scramAuth = new ScramAuth('testuser', 'testpass', algorithm)
        const firstMessage = scramAuth.clientFirst()

        expect(firstMessage).toBeInstanceOf(Buffer)
        expect(firstMessage.toString()).toContain('n=testuser')
      })
    })
  })

  describe('error handling', () => {
    it('should handle empty username', () => {
      const scramAuth = new ScramAuth('', 'testpass')
      const firstMessage = scramAuth.clientFirst()
      expect(firstMessage.toString()).toContain('n=,')
    })

    it('should handle empty password', () => {
      const scramAuth = new ScramAuth('testuser', '')
      expect(() => scramAuth.clientFirst()).not.toThrow()
    })

    it('should handle server message without required parameters', () => {
      const scramAuth = new ScramAuth('user', 'pencil')
      scramAuth.clientFirst()

      const incompleteServerMessage = Buffer.from('r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j')

      expect(() => {
        scramAuth.clientFinal(incompleteServerMessage)
      }).toThrow()
    })
  })
})
