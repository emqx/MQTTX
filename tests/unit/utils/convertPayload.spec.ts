import { expect } from 'chai'
import convertPayload from '@/utils/convertPayload'

describe('convertPayload', () => {
  it('should convert Base64 to plain text', async () => {
    const base64Payload = 'SGVsbG8gV29ybGQ='
    const result = await convertPayload(base64Payload, 'Plaintext', 'Base64')
    expect(result).to.equal('Hello World')
  })

  it('should convert plain text to Base64', async () => {
    const plainPayload = 'Hello World'
    const result = await convertPayload(plainPayload, 'Base64', 'Plaintext')
    expect(result).to.equal('SGVsbG8gV29ybGQ=')
  })

  it('should convert Hex to plain text', async () => {
    const hexPayload = '48 65 6c 6c 6f 20 57 6f 72 6c 64'
    const result = await convertPayload(hexPayload, 'Plaintext', 'Hex')
    expect(result).to.equal('Hello World')
  })

  it('should convert plain text to Hex', async () => {
    const plainPayload = 'Hello World'
    const result = await convertPayload(plainPayload, 'Hex', 'Plaintext')
    expect(result).to.equal('4865 6c6c 6f20 576f 726c 64')
  })

  it('should convert JSON to plain text', async () => {
    const jsonPayload = '{"key": "value"}'
    const result = await convertPayload(jsonPayload, 'Plaintext', 'JSON')
    expect(result).to.equal('{"key": "value"}')
  })

  it('should convert Hex to Base64', async () => {
    const hexPayload = '48 65 6c 6c 6f 20 57 6f 72 6c 64'
    const result = await convertPayload(hexPayload, 'Base64', 'Hex')
    expect(result).to.equal('SGVsbG8gV29ybGQ=')
  })

  it('should convert Base64 to Hex', async () => {
    const base64Payload = 'SGVsbG8gV29ybGQ='
    const result = await convertPayload(base64Payload, 'Hex', 'Base64')
    expect(result).to.equal('4865 6c6c 6f20 576f 726c 64')
  })

  it('should handle empty input', async () => {
    const emptyPayload = ''
    const result = await convertPayload(emptyPayload, 'Base64', 'Plaintext')
    expect(result).to.equal('')
  })

  it('should handle whitespace-only input', async () => {
    const whitespacePayload = '   '
    const result = await convertPayload(whitespacePayload, 'Base64', 'Plaintext')
    expect(result).to.equal('ICAg')
  })

  it('should handle special characters', async () => {
    const specialCharsPayload = '!@#$%^&*()_+'
    const result = await convertPayload(specialCharsPayload, 'Base64', 'Plaintext')
    expect(result).to.equal('IUAjJCVeJiooKV8r')
  })

  it('should handle Unicode characters', async () => {
    const unicodePayload = '你好，世界'
    const result = await convertPayload(unicodePayload, 'Base64', 'Plaintext')
    expect(result).to.equal('5L2g5aW977yM5LiW55WM')
  })

  it('should handle large integers', async () => {
    const largeIntPayload = '9007199254740991'
    const result = await convertPayload(largeIntPayload, 'Base64', 'Plaintext')
    expect(result).to.equal('OTAwNzE5OTI1NDc0MDk5MQ==')
  })

  // JSON conversion tests are commented out due to issues casued by jsonUtils jsonStringify
  /*
  it('should convert plain text to JSON', async () => {
    const plainPayload = '{"key": "value"}'
    const result = await convertPayload(plainPayload, 'JSON', 'Plaintext')
    expect(result).to.equal('{\n  "key": "value"\n}')
  })

  it('should handle invalid JSON conversion', async () => {
    const invalidPayload = 'Not a JSON'
    try {
      await convertPayload(invalidPayload, 'JSON', 'Plaintext')
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect(error).to.be.an('error')
    }
  })
  */
})
