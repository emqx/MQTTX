import { expect } from 'chai'
import cbor from 'cbor'
import { unpack } from 'msgpackr'
import { encodePayloadByType, payloadTypeToEditorLang, validatePayloadByType } from '@/utils/payloadEncoder'

describe('payloadEncoder', () => {
  describe('payloadTypeToEditorLang', () => {
    it('uses the JSON highlighter for the JSON-authored formats', () => {
      expect(payloadTypeToEditorLang('JSON')).to.equal('json')
      expect(payloadTypeToEditorLang('CBOR')).to.equal('json')
      expect(payloadTypeToEditorLang('MsgPack')).to.equal('json')
    })

    it('falls back to plaintext for the raw formats', () => {
      expect(payloadTypeToEditorLang('Plaintext')).to.equal('plaintext')
      expect(payloadTypeToEditorLang('Base64')).to.equal('plaintext')
      expect(payloadTypeToEditorLang('Hex')).to.equal('plaintext')
    })
  })

  describe('encodePayloadByType', () => {
    it('keeps plaintext and JSON as strings', () => {
      expect(encodePayloadByType('offline', 'Plaintext')).to.equal('offline')
      expect(encodePayloadByType('{"status":"offline"}', 'JSON')).to.equal('{"status":"offline"}')
    })

    it('defaults to plaintext when no type is given', () => {
      expect(encodePayloadByType('offline')).to.equal('offline')
    })

    it('decodes Base64 into the bytes it represents', () => {
      const result = encodePayloadByType('b2ZmbGluZQ==', 'Base64')
      expect(Buffer.isBuffer(result)).to.be.true
      expect((result as Buffer).toString()).to.equal('offline')
    })

    it('decodes Hex, ignoring the spacing the editor adds', () => {
      const result = encodePayloadByType('6f66 666c 696e 65', 'Hex')
      expect(Buffer.isBuffer(result)).to.be.true
      expect((result as Buffer).toString()).to.equal('offline')
    })

    it('encodes CBOR so the broker receives real CBOR bytes', () => {
      const result = encodePayloadByType('{"status":"offline"}', 'CBOR')
      expect(Buffer.isBuffer(result)).to.be.true
      expect(cbor.decodeFirstSync(result as Buffer)).to.deep.equal({ status: 'offline' })
    })

    it('encodes MsgPack so the broker receives real MsgPack bytes', () => {
      const result = encodePayloadByType('{"status":"offline"}', 'MsgPack')
      expect(Buffer.isBuffer(result)).to.be.true
      expect(unpack(result as Buffer)).to.deep.equal({ status: 'offline' })
    })

    it('throws when the payload cannot be encoded as the chosen type', () => {
      expect(() => encodePayloadByType('not json', 'MsgPack')).to.throw()
      expect(() => encodePayloadByType('not json', 'CBOR')).to.throw()
      expect(() => encodePayloadByType('not json', 'JSON')).to.throw()
    })
  })

  describe('validatePayloadByType', () => {
    it('accepts an empty payload for every type', () => {
      expect(validatePayloadByType('', 'Hex')).to.be.undefined
      expect(validatePayloadByType('', 'Base64')).to.be.undefined
      expect(validatePayloadByType('', 'MsgPack')).to.be.undefined
    })

    it('accepts well-formed payloads', () => {
      expect(validatePayloadByType('b2ZmbGluZQ==', 'Base64')).to.be.undefined
      expect(validatePayloadByType('6f66 666c 696e 65', 'Hex')).to.be.undefined
      expect(validatePayloadByType('{"status":"offline"}', 'MsgPack')).to.be.undefined
      expect(validatePayloadByType('anything at all', 'Plaintext')).to.be.undefined
    })

    // Buffer.from ignores bad characters, so these would send a broken payload.
    it('rejects Base64 that Buffer.from would silently truncate', () => {
      expect(validatePayloadByType('not base64!', 'Base64')).to.be.a('string')
      expect(validatePayloadByType('b2ZmbGluZQ=', 'Base64')).to.be.a('string')
    })

    it('rejects Hex that is not a whole number of bytes', () => {
      expect(validatePayloadByType('6f6', 'Hex')).to.be.a('string')
      expect(validatePayloadByType('zzzz', 'Hex')).to.be.a('string')
    })

    it('reports the parser error for the JSON-authored formats', () => {
      expect(validatePayloadByType('not json', 'MsgPack')).to.be.a('string')
      expect(validatePayloadByType('not json', 'CBOR')).to.be.a('string')
    })
  })
})
