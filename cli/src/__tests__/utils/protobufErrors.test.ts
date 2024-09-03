import { transformPBJSError } from '../../utils/protobufErrors'
import { expect, describe, it } from '@jest/globals'

describe('transformPBJSError', () => {
  it('prepends message with deserialization error', () => {
    const error = new Error('Some error')
    const transformedError = transformPBJSError(error)
    expect(transformedError.message).toMatch(/^Message deserialization error: Some error$/)
  })

  it('transforms index out of range error', () => {
    const error = new Error('index out of range: 10 + 5 > 12')
    const transformedError = transformPBJSError(error)
    expect(transformedError.message).toMatch(
      /^Message deserialization error: Index out of range: the reader was at position 10 and tried to read 5 more \(bytes\), but the given buffer was 12 bytes$/,
    )
  })

  it('handles non-matching index out of range error', () => {
    const error = new Error('Some other index out of range error')
    const transformedError = transformPBJSError(error)
    expect(transformedError.message).toBe('Message deserialization error: Some other index out of range error')
  })

  it('handles multiple transformations', () => {
    const error = new Error('index out of range: 100 + 50 > 120')
    const transformedError = transformPBJSError(error)
    expect(transformedError.message).toMatch(
      /^Message deserialization error: Index out of range: the reader was at position 100 and tried to read 50 more \(bytes\), but the given buffer was 120 bytes$/,
    )
  })
})
