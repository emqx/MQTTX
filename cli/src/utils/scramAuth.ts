import * as crypto from 'crypto'
import * as pbkdf2 from 'pbkdf2'

export type ScramAlgorithm = 'SCRAM-SHA-1' | 'SCRAM-SHA-256' | 'SCRAM-SHA-512'

export class ScramAuth {
  private username: string
  private password: string
  private algorithm: ScramAlgorithm
  private clientNonce: string
  private clientFirstMessage: string = ''
  private serverFirstMessage: string = ''

  constructor(username: string, password: string, algorithm: ScramAlgorithm = 'SCRAM-SHA-256') {
    this.username = username
    this.password = password
    this.algorithm = algorithm
    this.clientNonce = crypto.randomBytes(32).toString('base64')
  }

  private getHashFunction(): string {
    switch (this.algorithm) {
      case 'SCRAM-SHA-1':
        return 'sha1'
      case 'SCRAM-SHA-256':
        return 'sha256'
      case 'SCRAM-SHA-512':
        return 'sha512'
      default:
        throw new Error(`Unsupported algorithm: ${this.algorithm}`)
    }
  }

  private getHashLength(): number {
    switch (this.algorithm) {
      case 'SCRAM-SHA-1':
        return 20
      case 'SCRAM-SHA-256':
        return 32
      case 'SCRAM-SHA-512':
        return 64
      default:
        throw new Error(`Unsupported algorithm: ${this.algorithm}`)
    }
  }

  private saslPrep(str: string): string {
    // Basic SCRAM string preparation - escape = and , characters
    return str.replace(/=/g, '=3D').replace(/,/g, '=2C')
  }

  clientFirst(): Buffer {
    const usernameSasl = this.saslPrep(this.username)
    this.clientFirstMessage = `n,,n=${usernameSasl},r=${this.clientNonce}`
    return Buffer.from(this.clientFirstMessage)
  }

  clientFinal(serverFirstData: Buffer): Buffer {
    this.serverFirstMessage = serverFirstData.toString()

    // Parse server message: r=clientNonce+serverNonce,s=salt,i=iterationCount
    const serverParams: Record<string, string> = {}
    this.serverFirstMessage.split(',').forEach((param) => {
      const eqIndex = param.indexOf('=')
      if (eqIndex > 0) {
        const key = param.substring(0, eqIndex)
        const value = param.substring(eqIndex + 1)
        serverParams[key] = value
      }
    })

    const fullNonce = serverParams.r
    const salt = Buffer.from(serverParams.s, 'base64')
    const iterationCount = parseInt(serverParams.i)

    // Verify nonce starts with our client nonce
    if (!fullNonce.startsWith(this.clientNonce)) {
      throw new Error('Invalid server nonce')
    }

    // Calculate saltedPassword
    const passwordSasl = this.saslPrep(this.password)
    const hashFunc = this.getHashFunction()
    const hashLength = this.getHashLength()
    const saltedPassword = pbkdf2.pbkdf2Sync(passwordSasl, salt, iterationCount, hashLength, hashFunc)

    // Calculate keys
    // @ts-ignore - Node.js crypto types compatibility
    const clientKey = crypto.createHmac(hashFunc, saltedPassword).update('Client Key').digest()
    // @ts-ignore - Node.js crypto types compatibility
    const storedKey = crypto.createHash(hashFunc).update(clientKey).digest()

    // Build auth message
    const clientFinalWithoutProof = `c=biws,r=${fullNonce}`
    const authMessage = `${this.clientFirstMessage.substring(3)},${this.serverFirstMessage},${clientFinalWithoutProof}`

    // Calculate client proof
    // @ts-ignore - Node.js crypto types compatibility
    const clientSignature = crypto.createHmac(hashFunc, storedKey).update(authMessage).digest()
    const clientProof = Buffer.alloc(clientKey.length)
    for (let i = 0; i < clientKey.length; i++) {
      clientProof[i] = clientKey[i] ^ clientSignature[i]
    }

    // Build final message
    const clientFinalMessage = `${clientFinalWithoutProof},p=${clientProof.toString('base64')}`
    return Buffer.from(clientFinalMessage)
  }
}
