/**
 * @description: Simulated dynamic switch command
 * @param {object} params - The parameters object
 * @param {string} params.payload - Message payload
 * @param {string} params.messageType - Message type, value is 'received' or 'publish'
 * @param {number} params.sendCounter - Counter for sent messages (only valid when timed sending is enabled)
 * @return {string} - Return two commands alternately, { "command": "on" } or { "command": "off" }
 */
function handlePayload(params) {
  const { payload, sendCounter } = params
  let _message = JSON.parse(payload || '{}')
  if (sendCounter % 2 === 0) {
    _message.command = 'on'
  } else {
    _message.command = 'off'
  }
  return JSON.stringify(_message, null, 2)
}

return execute(handlePayload)
