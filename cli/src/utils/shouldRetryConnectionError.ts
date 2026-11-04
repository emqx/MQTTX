// Socket errors forwarded by MQTT.js are retried by its reconnect timer after close.
// Protocol/authentication errors must still end the client instead of waiting indefinitely.
const retryableSocketErrors = ['ECONNREFUSED', 'ECONNRESET', 'EADDRINUSE', 'ENOTFOUND']

const shouldRetryConnectionError = (error: Error, reconnectPeriod?: number): boolean => {
  const { code } = error as NodeJS.ErrnoException
  const reconnectEnabled = reconnectPeriod === undefined || reconnectPeriod > 0
  return reconnectEnabled && code !== undefined && retryableSocketErrors.includes(code)
}

export default shouldRetryConnectionError
