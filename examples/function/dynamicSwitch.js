/**
 * @description: Simulated dynamic switch command
 * @param {string} message - Message payload
 * @param {string} messageType - Message type, value is 'received' or 'publish'
 * @param {number} index - Index of the message, valid only when script is used in the publish message and timed message is enabled
 * @return {string} - Return two commands alternately, { "command": "on" } or { "command": "off" }
 */
function handlePayload(message, messageType, index) {
  let _message = JSON.parse(message || '{}')
  if (index % 2 === 0) {
    _message.command = 'on'
  } else {
    _message.command = 'off'
  }
  return JSON.stringify(_message, null, 2)
}

return execute(handlePayload)
