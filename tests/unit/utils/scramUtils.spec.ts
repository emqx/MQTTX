import { expect } from 'chai'
import { setupScramAuth, setupAuthHandler } from '@/utils/scramUtils'
import { ScramAuth } from '@/utils/scramAuth'

describe('scramUtils', () => {
  describe('setupScramAuth', () => {
    let mockRecord: ConnectionModel
    let mockOptions: any

    beforeEach(() => {
      mockRecord = {
        username: 'testuser',
        password: 'testpass',
        properties: {
          authenticationMethod: 'SCRAM-SHA-256',
        },
      } as ConnectionModel

      mockOptions = {
        protocolVersion: 5,
        properties: {},
      }
    })

    it('should return undefined for non-MQTT5', () => {
      mockOptions.protocolVersion = 4
      const result = setupScramAuth(mockRecord, mockOptions)
      expect(result).to.be.undefined
    })

    it('should return undefined when no auth method', () => {
      mockRecord.properties!.authenticationMethod = undefined
      const result = setupScramAuth(mockRecord, mockOptions)
      expect(result).to.be.undefined
    })

    it('should handle empty username', () => {
      mockRecord.username = ''
      const result = setupScramAuth(mockRecord, mockOptions)
      // Empty username should either work or fail gracefully (return undefined)
      expect(result).to.satisfy((val: any) => val === undefined || val instanceof ScramAuth)
    })

    it('should handle empty password', () => {
      mockRecord.password = ''
      const result = setupScramAuth(mockRecord, mockOptions)
      // Empty password should either work or fail gracefully (return undefined)
      expect(result).to.satisfy((val: any) => val === undefined || val instanceof ScramAuth)
    })

    it('should return undefined for unsupported auth method', () => {
      mockRecord.properties!.authenticationMethod = 'PLAIN'
      const result = setupScramAuth(mockRecord, mockOptions)
      expect(result).to.be.undefined
    })

    it('should create ScramAuth for SCRAM-SHA-1', () => {
      mockRecord.properties!.authenticationMethod = 'SCRAM-SHA-1'
      const result = setupScramAuth(mockRecord, mockOptions)
      expect(result).to.be.instanceOf(ScramAuth)
    })

    it('should create ScramAuth for SCRAM-SHA-256', () => {
      mockRecord.properties!.authenticationMethod = 'SCRAM-SHA-256'
      const result = setupScramAuth(mockRecord, mockOptions)
      expect(result).to.be.instanceOf(ScramAuth)
    })

    it('should create ScramAuth for SCRAM-SHA-512', () => {
      mockRecord.properties!.authenticationMethod = 'SCRAM-SHA-512'
      const result = setupScramAuth(mockRecord, mockOptions)
      expect(result).to.be.instanceOf(ScramAuth)
    })

    it('should set authentication properties in options', () => {
      const result = setupScramAuth(mockRecord, mockOptions)
      expect(result).to.be.instanceOf(ScramAuth)
      expect(mockOptions.properties.authenticationMethod).to.equal('SCRAM-SHA-256')
      expect(mockOptions.properties.authenticationData).to.be.instanceOf(Buffer)
    })

    it('should create properties object if not exists', () => {
      delete mockOptions.properties
      const result = setupScramAuth(mockRecord, mockOptions)
      expect(result).to.be.instanceOf(ScramAuth)
      expect(mockOptions.properties).to.be.an('object')
      expect(mockOptions.properties.authenticationMethod).to.equal('SCRAM-SHA-256')
    })

    it('should handle invalid credentials gracefully', () => {
      // Test with empty strings which might cause issues
      mockRecord.username = ''
      mockRecord.password = ''
      const result = setupScramAuth(mockRecord, mockOptions)
      // Should either work or return undefined, not throw
      expect(result).to.satisfy((val: any) => val === undefined || val instanceof ScramAuth)
    })
  })

  describe('setupAuthHandler', () => {
    let mockClient: any
    let mockScramAuth: any
    let authMethod: string
    let clientFinalCalled: boolean
    let clientFinalArgs: any[]

    beforeEach(() => {
      clientFinalCalled = false
      clientFinalArgs = []

      mockClient = {
        handleAuth: null,
      }
      mockScramAuth = {
        clientFinal: (data: Buffer) => {
          clientFinalCalled = true
          clientFinalArgs.push(data)
          return Buffer.from('final-response')
        },
      }
      authMethod = 'SCRAM-SHA-256'
    })

    it('should set handleAuth function on client', () => {
      setupAuthHandler(mockClient, mockScramAuth, authMethod)
      expect(mockClient.handleAuth).to.be.a('function')
    })

    it('should handle auth packet correctly', () => {
      setupAuthHandler(mockClient, mockScramAuth, authMethod)

      const mockPacket = {
        properties: {
          authenticationData: Buffer.from('server-data'),
        },
      }
      let callbackError: any = undefined
      let callbackResponse: any = undefined
      const mockCallback = (error: any, response: any) => {
        callbackError = error
        callbackResponse = response
      }

      mockClient.handleAuth(mockPacket, mockCallback)

      expect(clientFinalCalled).to.be.true
      expect(clientFinalArgs).to.have.lengthOf(1)
      expect(clientFinalArgs[0]).to.deep.equal(mockPacket.properties.authenticationData)

      expect(callbackError).to.be.undefined // no error
      expect(callbackResponse).to.be.an('object') // auth response
      expect(callbackResponse.cmd).to.equal('auth')
      expect(callbackResponse.reasonCode).to.equal(0x18)
      expect(callbackResponse.properties.authenticationMethod).to.equal(authMethod)
      expect(callbackResponse.properties.authenticationData).to.be.instanceOf(Buffer)
    })

    it('should handle missing authentication data', () => {
      setupAuthHandler(mockClient, mockScramAuth, authMethod)

      const mockPacket = {
        properties: {},
      }
      let callbackError: any = undefined
      let callbackResponse: any = undefined
      const mockCallback = (error: any, response: any) => {
        callbackError = error
        callbackResponse = response
      }

      mockClient.handleAuth(mockPacket, mockCallback)

      expect(callbackError).to.be.instanceOf(Error)
      expect(callbackError.message).to.equal('No authentication data from server')
    })

    it('should handle ScramAuth clientFinal error', () => {
      mockScramAuth.clientFinal = () => {
        throw new Error('SCRAM error')
      }
      setupAuthHandler(mockClient, mockScramAuth, authMethod)

      const mockPacket = {
        properties: {
          authenticationData: Buffer.from('server-data'),
        },
      }
      let callbackError: any = undefined
      let callbackResponse: any = undefined
      const mockCallback = (error: any, response: any) => {
        callbackError = error
        callbackResponse = response
      }

      mockClient.handleAuth(mockPacket, mockCallback)

      expect(callbackError).to.be.instanceOf(Error)
      expect(callbackError.message).to.equal('SCRAM error')
    })

    it('should handle unknown error types', () => {
      mockScramAuth.clientFinal = () => {
        throw 'string error'
      }
      setupAuthHandler(mockClient, mockScramAuth, authMethod)

      const mockPacket = {
        properties: {
          authenticationData: Buffer.from('server-data'),
        },
      }
      let callbackError: any = undefined
      let callbackResponse: any = undefined
      const mockCallback = (error: any, response: any) => {
        callbackError = error
        callbackResponse = response
      }

      mockClient.handleAuth(mockPacket, mockCallback)

      expect(callbackError).to.be.instanceOf(Error)
      expect(callbackError.message).to.equal('SCRAM authentication failed')
    })
  })
})
