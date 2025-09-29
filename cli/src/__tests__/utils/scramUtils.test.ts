/// <reference types="../../types/global" />

import { setupScramAuth, setupAuthHandler } from '../../utils/scramUtils'
import { ScramAuth } from '../../utils/scramAuth'
import { MqttClient, IClientOptions } from 'mqtt'
import { IAuthPacket } from 'mqtt-packet'
import { expect, describe, it, jest, beforeEach } from '@jest/globals'

// Mock ScramAuth
jest.mock('../../utils/scramAuth', () => ({
  ScramAuth: jest.fn(),
}))

const MockedScramAuth = ScramAuth as jest.MockedClass<typeof ScramAuth>

describe('scramUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('setupScramAuth', () => {
    it('should return undefined for non-MQTT 5.0 protocol', () => {
      const options: IClientOptions = { protocolVersion: 4 }
      const result = setupScramAuth('user', 'pass', 'SCRAM-SHA-256', options)

      expect(result).toBeUndefined()
      expect(MockedScramAuth).not.toHaveBeenCalled()
    })

    it('should return undefined for unsupported auth method', () => {
      const options: IClientOptions = { protocolVersion: 5 }
      const result = setupScramAuth('user', 'pass', 'UNSUPPORTED-METHOD', options)

      expect(result).toBeUndefined()
      expect(MockedScramAuth).not.toHaveBeenCalled()
    })

    it('should setup SCRAM-SHA-1 authentication correctly', () => {
      const mockScramAuth = {
        clientFirst: jest.fn().mockReturnValue(Buffer.from('client-first-data')),
      }
      MockedScramAuth.mockImplementation(() => mockScramAuth as any)

      const options: IClientOptions = { protocolVersion: 5 }
      const result = setupScramAuth('user', 'pass', 'SCRAM-SHA-1', options)

      expect(MockedScramAuth).toHaveBeenCalledWith('user', 'pass', 'SCRAM-SHA-1')
      expect(mockScramAuth.clientFirst).toHaveBeenCalled()
      expect(options.properties?.authenticationMethod).toBe('SCRAM-SHA-1')
      expect(options.properties?.authenticationData).toEqual(Buffer.from('client-first-data'))
      expect(result).toBe(mockScramAuth)
    })

    it('should setup SCRAM-SHA-256 authentication correctly', () => {
      const mockScramAuth = {
        clientFirst: jest.fn().mockReturnValue(Buffer.from('client-first-data')),
      }
      MockedScramAuth.mockImplementation(() => mockScramAuth as any)

      const options: IClientOptions = { protocolVersion: 5 }
      const result = setupScramAuth('user', 'pass', 'SCRAM-SHA-256', options)

      expect(MockedScramAuth).toHaveBeenCalledWith('user', 'pass', 'SCRAM-SHA-256')
      expect(mockScramAuth.clientFirst).toHaveBeenCalled()
      expect(options.properties?.authenticationMethod).toBe('SCRAM-SHA-256')
      expect(options.properties?.authenticationData).toEqual(Buffer.from('client-first-data'))
      expect(result).toBe(mockScramAuth)
    })

    it('should setup SCRAM-SHA-512 authentication correctly', () => {
      const mockScramAuth = {
        clientFirst: jest.fn().mockReturnValue(Buffer.from('client-first-data')),
      }
      MockedScramAuth.mockImplementation(() => mockScramAuth as any)

      const options: IClientOptions = { protocolVersion: 5 }
      const result = setupScramAuth('user', 'pass', 'SCRAM-SHA-512', options)

      expect(MockedScramAuth).toHaveBeenCalledWith('user', 'pass', 'SCRAM-SHA-512')
      expect(mockScramAuth.clientFirst).toHaveBeenCalled()
      expect(options.properties?.authenticationMethod).toBe('SCRAM-SHA-512')
      expect(options.properties?.authenticationData).toEqual(Buffer.from('client-first-data'))
      expect(result).toBe(mockScramAuth)
    })

    it('should initialize properties object if not exists', () => {
      const mockScramAuth = {
        clientFirst: jest.fn().mockReturnValue(Buffer.from('client-first-data')),
      }
      MockedScramAuth.mockImplementation(() => mockScramAuth as any)

      const options: IClientOptions = { protocolVersion: 5 }
      setupScramAuth('user', 'pass', 'SCRAM-SHA-256', options)

      expect(options.properties).toBeDefined()
      expect(options.properties?.authenticationMethod).toBe('SCRAM-SHA-256')
      expect(options.properties?.authenticationData).toEqual(Buffer.from('client-first-data'))
    })

    it('should preserve existing properties', () => {
      const mockScramAuth = {
        clientFirst: jest.fn().mockReturnValue(Buffer.from('client-first-data')),
      }
      MockedScramAuth.mockImplementation(() => mockScramAuth as any)

      const options: IClientOptions = {
        protocolVersion: 5,
        properties: {
          userProperties: { existingProp: 'value' },
        },
      }
      setupScramAuth('user', 'pass', 'SCRAM-SHA-256', options)

      expect(options.properties?.userProperties).toEqual({ existingProp: 'value' })
      expect(options.properties?.authenticationMethod).toBe('SCRAM-SHA-256')
      expect(options.properties?.authenticationData).toEqual(Buffer.from('client-first-data'))
    })

    it('should return undefined when ScramAuth throws an error', () => {
      MockedScramAuth.mockImplementation(() => {
        throw new Error('SCRAM initialization failed')
      })

      const options: IClientOptions = { protocolVersion: 5 }
      const result = setupScramAuth('user', 'pass', 'SCRAM-SHA-256', options)

      expect(result).toBeUndefined()
    })

    it('should return undefined when clientFirst throws an error', () => {
      const mockScramAuth = {
        clientFirst: jest.fn().mockImplementation(() => {
          throw new Error('Client first failed')
        }),
      }
      MockedScramAuth.mockImplementation(() => mockScramAuth as any)

      const options: IClientOptions = { protocolVersion: 5 }
      const result = setupScramAuth('user', 'pass', 'SCRAM-SHA-256', options)

      expect(result).toBeUndefined()
    })
  })

  describe('setupAuthHandler', () => {
    let mockClient: Partial<MqttClient>
    let mockScramAuth: Partial<ScramAuth>
    let authHandler: (packet: IAuthPacket, callback: (error?: Error, response?: unknown) => void) => void

    beforeEach(() => {
      mockClient = {}
      mockScramAuth = {
        clientFinal: jest.fn(() => Buffer.from('client-final-data')),
      }

      setupAuthHandler(mockClient as MqttClient, mockScramAuth as ScramAuth, 'SCRAM-SHA-256')
      authHandler = mockClient.handleAuth!
    })

    it('should setup auth handler on client', () => {
      expect(mockClient.handleAuth).toBeDefined()
      expect(typeof mockClient.handleAuth).toBe('function')
    })

    it('should handle successful authentication', () => {
      const mockCallback = jest.fn()
      const mockPacket: IAuthPacket = {
        cmd: 'auth',
        reasonCode: 0,
        properties: {
          authenticationData: Buffer.from('server-auth-data'),
        },
      }

      ;(mockScramAuth.clientFinal as jest.Mock).mockReturnValue(Buffer.from('client-final-data'))

      authHandler(mockPacket, mockCallback)

      expect(mockScramAuth.clientFinal).toHaveBeenCalledWith(Buffer.from('server-auth-data'))
      expect(mockCallback).toHaveBeenCalledWith(undefined, {
        cmd: 'auth',
        reasonCode: 0x18,
        properties: {
          authenticationMethod: 'SCRAM-SHA-256',
          authenticationData: Buffer.from('client-final-data'),
        },
      })
    })

    it('should handle missing authentication data from server', () => {
      const mockCallback = jest.fn()
      const mockPacket: IAuthPacket = {
        cmd: 'auth',
        reasonCode: 0,
        properties: {},
      }

      authHandler(mockPacket, mockCallback)

      expect(mockCallback).toHaveBeenCalledWith(new Error('No authentication data from server'))
      expect(mockScramAuth.clientFinal).not.toHaveBeenCalled()
    })

    it('should handle packet without properties', () => {
      const mockCallback = jest.fn()
      const mockPacket: IAuthPacket = {
        cmd: 'auth',
        reasonCode: 0,
      }

      authHandler(mockPacket, mockCallback)

      expect(mockCallback).toHaveBeenCalledWith(new Error('No authentication data from server'))
      expect(mockScramAuth.clientFinal).not.toHaveBeenCalled()
    })

    it('should handle SCRAM authentication errors', () => {
      const mockCallback = jest.fn()
      const mockPacket: IAuthPacket = {
        cmd: 'auth',
        reasonCode: 0,
        properties: {
          authenticationData: Buffer.from('server-auth-data'),
        },
      }
      const scramError = new Error('SCRAM error')

      ;(mockScramAuth.clientFinal as jest.Mock).mockImplementation(() => {
        throw scramError
      })

      authHandler(mockPacket, mockCallback)

      expect(mockCallback).toHaveBeenCalledWith(scramError)
    })

    it('should handle non-Error SCRAM exceptions', () => {
      const mockCallback = jest.fn()
      const mockPacket: IAuthPacket = {
        cmd: 'auth',
        reasonCode: 0,
        properties: {
          authenticationData: Buffer.from('server-auth-data'),
        },
      }

      ;(mockScramAuth.clientFinal as jest.Mock).mockImplementation(() => {
        throw 'String error'
      })

      authHandler(mockPacket, mockCallback)

      expect(mockCallback).toHaveBeenCalledWith(new Error('SCRAM authentication failed'))
    })

    it('should use correct auth method in response', () => {
      const mockCallback = jest.fn()
      const mockPacket: IAuthPacket = {
        cmd: 'auth',
        reasonCode: 0,
        properties: {
          authenticationData: Buffer.from('server-auth-data'),
        },
      }

      ;(mockScramAuth.clientFinal as jest.Mock).mockReturnValue(Buffer.from('client-final-data'))

      // Test with different auth method
      setupAuthHandler(mockClient as MqttClient, mockScramAuth as ScramAuth, 'SCRAM-SHA-512')
      const newAuthHandler = mockClient.handleAuth!

      newAuthHandler(mockPacket, mockCallback)

      expect(mockCallback).toHaveBeenCalledWith(undefined, {
        cmd: 'auth',
        reasonCode: 0x18,
        properties: {
          authenticationMethod: 'SCRAM-SHA-512',
          authenticationData: Buffer.from('client-final-data'),
        },
      })
    })
  })

  describe('integration tests', () => {
    it('should work together for complete SCRAM setup', () => {
      const mockScramAuth = {
        clientFirst: jest.fn().mockReturnValue(Buffer.from('client-first-data')),
        clientFinal: jest.fn().mockReturnValue(Buffer.from('client-final-data')),
      }
      MockedScramAuth.mockImplementation(() => mockScramAuth as any)

      const options: IClientOptions = { protocolVersion: 5 }
      const scramAuth = setupScramAuth('user', 'pass', 'SCRAM-SHA-256', options)

      expect(scramAuth).toBe(mockScramAuth)

      const mockClient: Partial<MqttClient> = {}
      setupAuthHandler(mockClient as MqttClient, scramAuth!, 'SCRAM-SHA-256')

      expect(mockClient.handleAuth).toBeDefined()

      // Test the auth handler
      const mockCallback = jest.fn()
      const mockPacket: IAuthPacket = {
        cmd: 'auth',
        reasonCode: 0,
        properties: {
          authenticationData: Buffer.from('server-auth-data'),
        },
      }

      mockClient.handleAuth!(mockPacket, mockCallback)

      expect(mockScramAuth.clientFinal).toHaveBeenCalledWith(Buffer.from('server-auth-data'))
      expect(mockCallback).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          cmd: 'auth',
          reasonCode: 0x18,
          properties: {
            authenticationMethod: 'SCRAM-SHA-256',
            authenticationData: Buffer.from('client-final-data'),
          },
        }),
      )
    })
  })
})
