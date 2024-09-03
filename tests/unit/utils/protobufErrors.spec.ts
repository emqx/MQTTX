import { expect } from 'chai'
import { transformPBJSError } from '@/utils/protobufErrors'

describe('protobufErrors', () => {
  describe('transformPBJSError', () => {
    it('should prepend "Message deserialization error: " to the error message', () => {
      const error = new Error('Test error')
      const transformedError = transformPBJSError(error)
      expect(transformedError.message).to.equal('Message deserialization error: Test error')
    })

    it('should transform index out of range error message', () => {
      const error = new Error('index out of range: 10 + 5 > 12')
      const transformedError = transformPBJSError(error)
      expect(transformedError.message).to.equal(
        'Message deserialization error: Index out of range: the reader was at position 10 and tried to read 5 more (bytes), but the given buffer was 12 bytes',
      )
    })

    it('should not transform non-index out of range error messages', () => {
      const error = new Error('Some other error')
      const transformedError = transformPBJSError(error)
      expect(transformedError.message).to.equal('Message deserialization error: Some other error')
    })

    it('should handle errors with complex index out of range messages', () => {
      const error = new Error('Multiple errors occurred: 1) index out of range: 15 + 8 > 20 2) Another error')
      const transformedError = transformPBJSError(error)
      expect(transformedError.message).to.equal(
        'Message deserialization error: Multiple errors occurred: 1) Index out of range: the reader was at position 15 and tried to read 8 more (bytes), but the given buffer was 20 bytes 2) Another error',
      )
    })

    it('should return a new Error instance', () => {
      const error = new Error('Test error')
      const transformedError = transformPBJSError(error)
      expect(transformedError).to.be.instanceOf(Error)
      expect(transformedError).to.not.equal(error)
    })
  })
})
