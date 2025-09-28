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
    this.clientNonce = this.generateNonce()
  }

  private generateNonce(): string {
    // Generate a random nonce for browser environment
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
  }

  private getHashFunction(): string {
    switch (this.algorithm) {
      case 'SCRAM-SHA-1':
        return 'SHA-1'
      case 'SCRAM-SHA-256':
        return 'SHA-256'
      case 'SCRAM-SHA-512':
        return 'SHA-512'
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

  private async pbkdf2(
    password: string,
    salt: ArrayBuffer,
    iterations: number,
    keyLength: number,
    hashAlg: string,
  ): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])

    return crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: hashAlg,
      },
      passwordKey,
      keyLength * 8,
    )
  }

  private async hmac(key: ArrayBuffer, data: string, hashAlg: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: hashAlg }, false, ['sign'])
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  }

  private async hash(data: ArrayBuffer, hashAlg: string): Promise<ArrayBuffer> {
    return crypto.subtle.digest(hashAlg, data)
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  clientFirst(): Buffer {
    const usernameSasl = this.saslPrep(this.username)
    this.clientFirstMessage = `n,,n=${usernameSasl},r=${this.clientNonce}`
    return Buffer.from(this.clientFirstMessage)
  }

  async clientFinal(serverFirstData: Buffer): Promise<Buffer> {
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
    const salt = this.base64ToArrayBuffer(serverParams.s)
    const iterationCount = parseInt(serverParams.i)

    // Verify nonce starts with our client nonce
    if (!fullNonce.startsWith(this.clientNonce)) {
      throw new Error('Invalid server nonce')
    }

    // Calculate saltedPassword
    const passwordSasl = this.saslPrep(this.password)
    const hashFunc = this.getHashFunction()
    const hashLength = this.getHashLength()
    const saltedPassword = await this.pbkdf2(passwordSasl, salt, iterationCount, hashLength, hashFunc)

    // Calculate keys
    const clientKey = await this.hmac(saltedPassword, 'Client Key', hashFunc)
    const storedKey = await this.hash(clientKey, hashFunc)

    // Build auth message
    const clientFinalWithoutProof = `c=biws,r=${fullNonce}`
    const authMessage = `${this.clientFirstMessage.substring(3)},${this.serverFirstMessage},${clientFinalWithoutProof}`

    // Calculate client proof
    const clientSignature = await this.hmac(storedKey, authMessage, hashFunc)
    const clientKeyBytes = new Uint8Array(clientKey)
    const clientSignatureBytes = new Uint8Array(clientSignature)
    const clientProof = new Uint8Array(clientKeyBytes.length)

    for (let i = 0; i < clientKeyBytes.length; i++) {
      clientProof[i] = clientKeyBytes[i] ^ clientSignatureBytes[i]
    }

    // Build final message
    const clientFinalMessage = `${clientFinalWithoutProof},p=${this.arrayBufferToBase64(clientProof.buffer)}`
    return Buffer.from(clientFinalMessage)
  }
}
