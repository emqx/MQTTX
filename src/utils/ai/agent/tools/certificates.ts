import fs from 'fs'
import crypto from 'crypto'
import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { assertReadableFile } from './helpers'

const DAY_MS = 24 * 60 * 60 * 1000
const PEM_CERTIFICATE = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g

/** Whole days until the certificate expires; negative once it has expired */
export const certificateDaysLeft = (validTo: string | number | Date, now: number = Date.now()): number =>
  Math.floor((new Date(validTo).getTime() - now) / DAY_MS)

const readCertificates = (data: Buffer): crypto.X509Certificate[] => {
  const text = data.toString('utf8')
  const blocks = text.includes('-----BEGIN CERTIFICATE-----') ? text.match(PEM_CERTIFICATE) : null
  const inputs: Array<string | Buffer> = blocks && blocks.length ? blocks : [data]
  return inputs.map((input) => {
    try {
      return new crypto.X509Certificate(input)
    } catch {
      // Never forward the parser error: it can contain certificate bytes
      throw new Error('Not a certificate file')
    }
  })
}

const describeCertificate = (cert: crypto.X509Certificate, now: number) => {
  const daysLeft = certificateDaysLeft(cert.validTo, now)
  return {
    subject: cert.subject,
    issuer: cert.issuer,
    subjectAltName: cert.subjectAltName ?? '',
    validFrom: cert.validFrom,
    validTo: cert.validTo,
    expired: daysLeft < 0,
    daysLeft,
    isCA: cert.ca,
    fingerprint256: cert.fingerprint256,
    serialNumber: cert.serialNumber,
  }
}

/**
 * Read-only tool that inspects certificates and (optionally) checks a private key against them.
 * It only ever returns metadata; key material and file contents are never included.
 */
export const createCertificateTools = (): ToolSet => ({
  inspect_certificate: tool({
    title: 'Inspect certificate',
    description:
      'Parse a PEM or DER certificate locally and return its metadata: subject, issuer, SAN, validity, ' +
      'CA flag and fingerprints. With a private key, it also reports whether the key matches the ' +
      'certificate and whether the key is encrypted. Never returns certificate or key contents.',
    inputSchema: z.object({
      path: z.string().describe('Absolute path of a PEM/DER certificate'),
      keyPath: z.string().optional().describe('Absolute path of the private key to check against the certificate'),
    }),
    execute: async ({ path: certPath, keyPath }) => {
      assertReadableFile('Certificate', certPath)
      const certs = readCertificates(fs.readFileSync(certPath))
      const now = Date.now()
      const certificates = certs.map((cert) => describeCertificate(cert, now))
      if (!keyPath) return { certificates }

      assertReadableFile('Private key', keyPath)
      const keyFile = fs.readFileSync(keyPath)
      if (/ENCRYPTED PRIVATE KEY|Proc-Type: 4,ENCRYPTED/.test(keyFile.toString('utf8'))) {
        return { certificates, key: { encrypted: true } }
      }
      let key: crypto.KeyObject
      try {
        key = crypto.createPrivateKey(keyFile)
      } catch {
        throw new Error('Not a private key file')
      }
      return {
        certificates,
        key: {
          keyType: key.asymmetricKeyType,
          matchesCertificate: certs.some((cert) => cert.checkPrivateKey(key)),
        },
      }
    },
  }),
})
