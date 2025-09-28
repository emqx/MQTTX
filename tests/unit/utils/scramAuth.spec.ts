import { expect } from 'chai'
import { ScramAuth } from '@/utils/scramAuth'

describe('ScramAuth', () => {
  let scramAuth: ScramAuth

  beforeEach(() => {
    scramAuth = new ScramAuth('testuser', 'testpass', 'SCRAM-SHA-256')
  })

  describe('constructor', () => {
    it('should create instance with correct credentials', () => {
      expect(scramAuth).to.be.instanceOf(ScramAuth)
    })

    it('should support SCRAM-SHA-1', () => {
      const auth = new ScramAuth('user', 'pass', 'SCRAM-SHA-1')
      expect(auth).to.be.instanceOf(ScramAuth)
    })

    it('should support SCRAM-SHA-256', () => {
      const auth = new ScramAuth('user', 'pass', 'SCRAM-SHA-256')
      expect(auth).to.be.instanceOf(ScramAuth)
    })

    it('should support SCRAM-SHA-512', () => {
      const auth = new ScramAuth('user', 'pass', 'SCRAM-SHA-512')
      expect(auth).to.be.instanceOf(ScramAuth)
    })

    it('should throw error for unsupported algorithm when used', () => {
      const auth = new ScramAuth('user', 'pass', 'INVALID-ALG' as any)

      // Get the client first message to extract the client nonce
      const clientFirstData = auth.clientFirst()
      const clientFirstMessage = clientFirstData.toString()
      const clientNonceMatch = clientFirstMessage.match(/r=([^,]+)/)
      const clientNonce = clientNonceMatch ? clientNonceMatch[1] : ''

      // Create server message with matching nonce
      const serverNonce = clientNonce + 'serverpart'
      const mockServerData = Buffer.from(`r=${serverNonce},s=c2FsdA==,i=4096`)

      expect(() => {
        auth.clientFinal(mockServerData)
      }).to.throw('Unsupported algorithm')
    })
  })

  describe('clientFirst', () => {
    it('should return a Buffer', () => {
      const result = scramAuth.clientFirst()
      expect(result).to.be.instanceOf(Buffer)
    })

    it('should return GS2 header format', () => {
      const result = scramAuth.clientFirst()
      const message = result.toString()
      expect(message).to.match(/^n,,n=.*,r=.*/)
    })

    it('should contain username in client first message', () => {
      const result = scramAuth.clientFirst()
      const message = result.toString()
      expect(message).to.include('n=testuser')
    })

    it('should contain random nonce', () => {
      const result1 = scramAuth.clientFirst()
      const result2 = new ScramAuth('testuser', 'testpass', 'SCRAM-SHA-256').clientFirst()

      expect(result1.toString()).to.not.equal(result2.toString())
    })
  })

  describe('clientFinal', () => {
    it('should process valid server first message', () => {
      const clientFirst = scramAuth.clientFirst()
      const clientFirstMessage = clientFirst.toString()

      // Extract client nonce from the first message
      const clientNonceMatch = clientFirstMessage.match(/r=([^,]+)/)
      const clientNonce = clientNonceMatch ? clientNonceMatch[1] : ''

      // Mock server first message
      const serverNonce = clientNonce + 'serverpart'
      const salt = Buffer.from('salt').toString('base64')
      const serverFirstMessage = `r=${serverNonce},s=${salt},i=4096`

      const result = scramAuth.clientFinal(Buffer.from(serverFirstMessage))
      expect(result).to.be.instanceOf(Buffer)

      const finalMessage = result.toString()
      expect(finalMessage).to.include('c=biws')
      expect(finalMessage).to.include(`r=${serverNonce}`)
      expect(finalMessage).to.include('p=')
    })

    it('should throw error for invalid server nonce', () => {
      scramAuth.clientFirst()

      const serverFirstMessage = 'r=invalidsernonce,s=c2FsdA==,i=4096'

      expect(() => {
        scramAuth.clientFinal(Buffer.from(serverFirstMessage))
      }).to.throw('Invalid server nonce')
    })

    it('should handle different iteration counts', () => {
      const clientFirst = scramAuth.clientFirst()
      const clientFirstMessage = clientFirst.toString()
      const clientNonceMatch = clientFirstMessage.match(/r=([^,]+)/)
      const clientNonce = clientNonceMatch ? clientNonceMatch[1] : ''

      const serverNonce = clientNonce + 'serverpart'
      const salt = Buffer.from('salt').toString('base64')

      // Test with different iteration counts
      const iterations = [1000, 4096, 8192]

      iterations.forEach((count) => {
        const serverFirstMessage = `r=${serverNonce},s=${salt},i=${count}`
        const result = scramAuth.clientFinal(Buffer.from(serverFirstMessage))
        expect(result).to.be.instanceOf(Buffer)
      })
    })
  })

  describe('SCRAM algorithm variants', () => {
    it('should work with SCRAM-SHA-1', () => {
      const auth = new ScramAuth('user', 'pass', 'SCRAM-SHA-1')
      const clientFirst = auth.clientFirst()
      expect(clientFirst).to.be.instanceOf(Buffer)
    })

    it('should work with SCRAM-SHA-512', () => {
      const auth = new ScramAuth('user', 'pass', 'SCRAM-SHA-512')
      const clientFirst = auth.clientFirst()
      expect(clientFirst).to.be.instanceOf(Buffer)
    })
  })

  describe('saslPrep handling', () => {
    it('should handle special characters in username', () => {
      const auth = new ScramAuth('user=name', 'pass', 'SCRAM-SHA-256')
      const result = auth.clientFirst()
      const message = result.toString()
      // Should either escape the = character or process with saslprep
      expect(message).to.match(/n=user.*name/)
    })

    it('should handle comma in username', () => {
      const auth = new ScramAuth('user,name', 'pass', 'SCRAM-SHA-256')
      const result = auth.clientFirst()
      const message = result.toString()
      // Should either escape the , character or process with saslprep
      expect(message).to.match(/n=user.*name/)
    })
  })
})
