import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  MAX_ATTACHMENTS,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  TEXT_MODEL_BYTES,
  attachmentLimitError,
  classifyAttachment,
  materializeAttachments,
  truncateText,
} from '@/utils/ai/agent/attachments'
import { resolveArchiveSync } from '@/utils/ai/agent/files'

const text = (value: string) => Buffer.from(value, 'utf8')

/** Minimal File/Blob stand-in: the unit test environment has no real Blob */
const fakeFile = (content: string): Blob =>
  ({
    arrayBuffer: async () => new TextEncoder().encode(content).buffer,
    text: async () => content,
  } as unknown as Blob)

describe('agent attachments', () => {
  describe('classifyAttachment', () => {
    it('should classify images by extension', () => {
      for (const name of ['a.png', 'a.jpg', 'a.jpeg', 'a.webp', 'a.gif', 'A.PNG']) {
        expect(classifyAttachment(name, text('x')), name).to.equal('image')
      }
    })

    it('should classify certificates by extension', () => {
      for (const name of ['ca.crt', 'ca.cer', 'ca.der']) {
        expect(classifyAttachment(name, Buffer.alloc(0)), name).to.equal('certificate')
      }
    })

    it('should classify keys by extension', () => {
      expect(classifyAttachment('client.key', Buffer.alloc(0))).to.equal('private-key')
    })

    it('should classify p12 and pfx as a bundle', () => {
      expect(classifyAttachment('store.p12', Buffer.alloc(0))).to.equal('bundle')
      expect(classifyAttachment('store.pfx', Buffer.alloc(0))).to.equal('bundle')
    })

    it('should classify by content when the extension is unknown', () => {
      const certificate = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----'
      expect(classifyAttachment('ca.txt', text(certificate))).to.equal('certificate')
      expect(classifyAttachment('client.pem', text('-----BEGIN CERTIFICATE-----'))).to.equal('certificate')
    })

    it('should recognise every private key header', () => {
      for (const header of ['PRIVATE KEY', 'RSA PRIVATE KEY', 'EC PRIVATE KEY', 'ENCRYPTED PRIVATE KEY']) {
        expect(classifyAttachment('client.pem', text(`-----BEGIN ${header}-----`)), header).to.equal('private-key')
      }
    })

    it('should classify text files', () => {
      for (const name of ['data.json', 'run.log', 'rows.csv', 'schema.proto', 'config.yaml', 'main.js', 'README']) {
        expect(classifyAttachment(name, text('hello world')), name).to.equal('text')
      }
    })

    it('should reject binary files', () => {
      expect(classifyAttachment('blob.bin', Buffer.from([0x00, 0x01, 0x02]))).to.equal(null)
      expect(classifyAttachment('weird.dat', Buffer.from([0xff, 0xfe, 0xfd]))).to.equal(null)
    })
  })

  describe('attachmentLimitError', () => {
    const counts = { images: 0, total: 0 }

    it('should accept files within the limits', () => {
      expect(attachmentLimitError('image', MAX_IMAGE_BYTES, counts)).to.equal(null)
      expect(attachmentLimitError('text', 1024, counts)).to.equal(null)
      expect(attachmentLimitError('certificate', 10 * 1024 * 1024, counts)).to.equal(null)
    })

    it('should reject an oversized image or text file', () => {
      expect(attachmentLimitError('image', MAX_IMAGE_BYTES + 1, counts)).to.equal('too-large')
      expect(attachmentLimitError('text', 256 * 1024 + 1, counts)).to.equal('too-large')
    })

    it('should reject more images than allowed', () => {
      expect(attachmentLimitError('image', 1024, { images: MAX_IMAGES, total: MAX_IMAGES })).to.equal('too-many-images')
    })

    it('should reject more attachments than allowed', () => {
      expect(attachmentLimitError('text', 10, { images: 0, total: MAX_ATTACHMENTS })).to.equal('too-many-attachments')
    })
  })

  describe('truncateText', () => {
    it('should keep short text as is', () => {
      expect(truncateText('hello')).to.deep.equal({ text: 'hello', truncated: false })
    })

    it('should cut long text to 64 KB', () => {
      const result = truncateText('a'.repeat(TEXT_MODEL_BYTES + 100))

      expect(result.truncated).to.equal(true)
      expect(Buffer.byteLength(result.text, 'utf8')).to.be.at.most(TEXT_MODEL_BYTES)
    })

    it('should not break a multi-byte character at the cut', () => {
      const result = truncateText('a'.repeat(TEXT_MODEL_BYTES - 1) + '€€€')

      expect(result.truncated).to.equal(true)
      expect(result.text).to.not.contain('\uFFFD')
      expect(Buffer.byteLength(result.text, 'utf8')).to.be.at.most(TEXT_MODEL_BYTES)
    })
  })

  describe('materializeAttachments', () => {
    let root: string
    const conversationId = '11111111-2222-3333-4444-555555555555'

    beforeEach(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-attachments-'))
    })

    afterEach(() => {
      fs.rmSync(root, { recursive: true, force: true })
    })

    it('should write images, read text and keep credential paths', async () => {
      const parts = await materializeAttachments(
        [
          { kind: 'image', name: 'shot.png', size: 4, mediaType: 'image/png', file: fakeFile('data') },
          { kind: 'text', name: 'notes.txt', size: 5, file: fakeFile('hello') },
          { kind: 'certificate', name: 'ca.crt', size: 10, path: path.join(os.tmpdir(), 'ca.crt') },
        ],
        conversationId,
        root,
      )

      expect(parts).to.have.length(3)
      expect(parts[0].kind).to.equal('image')
      expect(parts[0].relativePath).to.match(/^11111111-2222-3333-4444-555555555555\/attachments\/[a-z0-9]+\.png$/)
      expect(parts[0].relativePath).to.not.contain('\\')
      const filePath = resolveArchiveSync(parts[0].relativePath as string, root)
      expect(filePath).to.be.a('string')
      expect(fs.readFileSync(filePath as string).toString()).to.equal('data')

      expect(parts[1]).to.include({ kind: 'text', text: 'hello', truncated: false })

      expect(parts[2]).to.include({ kind: 'certificate', path: path.join(os.tmpdir(), 'ca.crt') })
      expect(parts[2].text).to.equal(undefined)
      expect(parts[2].relativePath).to.equal(undefined)
    })

    it('should truncate a long text file', async () => {
      const [part] = await materializeAttachments(
        [
          {
            kind: 'text',
            name: 'big.log',
            size: TEXT_MODEL_BYTES + 10,
            file: fakeFile('a'.repeat(TEXT_MODEL_BYTES + 10)),
          },
        ],
        conversationId,
        root,
      )
      expect(part.truncated).to.equal(true)
      expect(Buffer.byteLength(part.text as string, 'utf8')).to.be.at.most(TEXT_MODEL_BYTES)
    })

    it('should reject an invalid conversation id before writing an image', async () => {
      let error: Error | undefined
      try {
        await materializeAttachments(
          [{ kind: 'image', name: 'a.png', size: 1, mediaType: 'image/png', file: fakeFile('x') }],
          'not a uuid',
          root,
        )
      } catch (caught) {
        error = caught as Error
      }
      expect(error?.message).to.contain('Invalid conversation id')
    })
  })
})
