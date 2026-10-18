import { expect } from 'chai'
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { certificateDaysLeft, createCertificateTools } from '@/utils/ai/agent/tools/certificates'

const fixtures = path.resolve(process.cwd(), 'tests/unit/fixtures')
const certPath = path.join(fixtures, 'test-cert.pem')
const keyPath = path.join(fixtures, 'test-key.pem')
const otherKeyPath = path.join(fixtures, 'other-key.pem')

const inspect = (input: { path: string; keyPath?: string }): Promise<any> =>
  createCertificateTools().inspect_certificate.execute!(input as any, {} as any) as Promise<any>

describe('inspect_certificate', () => {
  it('should return the metadata of the certificate', async () => {
    const result = await inspect({ path: certPath })

    expect(result.certificates).to.have.length(1)
    const certificate = result.certificates[0]
    expect(certificate.subject).to.contain('mqttx-agent-test')
    expect(certificate.issuer).to.contain('mqttx-agent-test')
    expect(certificate.subjectAltName).to.contain('mqttx-agent-test.local')
    expect(certificate.expired).to.equal(false)
    expect(certificate.daysLeft).to.be.greaterThan(0)
    expect(certificate.isCA).to.equal(true)
    expect(certificate.fingerprint256).to.match(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/)
    expect(certificate.serialNumber).to.be.a('string')
  })

  it('should parse every certificate of a PEM bundle', async () => {
    const bundle = fs.readFileSync(certPath, 'utf8') + fs.readFileSync(certPath, 'utf8')
    const bundlePath = path.join(os.tmpdir(), `mqttx-bundle-${Date.now()}.pem`)
    fs.writeFileSync(bundlePath, bundle)
    try {
      const result = await inspect({ path: bundlePath })
      expect(result.certificates).to.have.length(2)
    } finally {
      fs.rmSync(bundlePath, { force: true })
    }
  })

  it('should report a matching private key', async () => {
    const result = await inspect({ path: certPath, keyPath })
    expect(result.key).to.include({ keyType: 'rsa', matchesCertificate: true })
  })

  it('should report a key that does not match', async () => {
    const result = await inspect({ path: certPath, keyPath: otherKeyPath })
    expect(result.key).to.include({ keyType: 'rsa', matchesCertificate: false })
  })

  it('should report an encrypted key without asking for a password', async () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    const encrypted = privateKey.export({ type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: 'secret' })
    const encryptedPath = path.join(os.tmpdir(), `mqttx-encrypted-${Date.now()}.key`)
    fs.writeFileSync(encryptedPath, encrypted)
    try {
      const result = await inspect({ path: certPath, keyPath: encryptedPath })
      expect(result.key).to.deep.equal({ encrypted: true })
    } finally {
      fs.rmSync(encryptedPath, { force: true })
    }
  })

  it('should fail with a fixed message for a file that is not a certificate', async () => {
    let error: Error | undefined
    try {
      await inspect({ path: keyPath })
    } catch (caught) {
      error = caught as Error
    }

    expect(error?.message).to.equal('Not a certificate file')
    expect(error?.message).to.not.contain('PRIVATE KEY')
  })

  it('should reject a relative path', async () => {
    let error: Error | undefined
    try {
      await inspect({ path: 'ca.crt' })
    } catch (caught) {
      error = caught as Error
    }
    expect(error?.message).to.contain('absolute path')
  })

  it('should reject a missing file', async () => {
    let error: Error | undefined
    try {
      await inspect({ path: path.join(fixtures, 'nope.pem') })
    } catch (caught) {
      error = caught as Error
    }
    expect(error?.message).to.contain('not found')
  })
})

describe('certificateDaysLeft', () => {
  const now = Date.parse('2026-01-01T00:00:00Z')

  it('should be positive for a future date', () => {
    expect(certificateDaysLeft('2026-01-11T00:00:00Z', now)).to.equal(10)
  })

  it('should be negative for a past date', () => {
    expect(certificateDaysLeft('2025-12-31T00:00:00Z', now)).to.equal(-1)
  })
})
