import shouldRetryConnectionError from '../../utils/shouldRetryConnectionError'

describe('shouldRetryConnectionError', () => {
  it.each(['ECONNREFUSED', 'ECONNRESET', 'EADDRINUSE', 'ENOTFOUND'])('retries %s when enabled', (code) => {
    const error = Object.assign(new Error('Socket error'), { code })
    expect(shouldRetryConnectionError(error, 1000)).toBe(true)
    expect(shouldRetryConnectionError(error)).toBe(true)
    expect(shouldRetryConnectionError(error, 0)).toBe(false)
    expect(shouldRetryConnectionError(error, -1)).toBe(false)
  })

  it.each([undefined, 5, 135, 'ERR_TLS_CERT_ALTNAME_INVALID'])('does not retry other errors with code %s', (code) => {
    expect(shouldRetryConnectionError(Object.assign(new Error('Connection error'), { code }), 1000)).toBe(false)
  })
})
