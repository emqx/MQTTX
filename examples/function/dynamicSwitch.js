/**
 * @description: Simulated dynamic switch command
 * @param {string | object} value - Payload
 * @param {string} msgType - Message type, value is 'received' or 'publish'
 * @param {number} index - Index of the message, valid only when script is used in the publish message and timed message is enabled
 * @return {object} - Return two commands alternately, { "command": "on" } or { "command": "off" }
 */
function handlePayload(value, msgType, index) {
  let _value = value
  if (typeof value === 'string') {
    _value = JSON.parse(value)
  }
  if (index % 2 === 0) {
    _value.command = 'on'
  }
  else {
    _value.command = 'off'
  }
  return JSON.stringify(_value, null, 2)
}

execute(handlePayload)
