/**
 * Convert timestamp to normal time
 * @param {object} params - The parameters object
 * @param {string} params.payload - Message payload - { "time": 1608185887 }
 * @param {string} params.messageType - Message type, value is 'received' or 'publish'
 * @return {string} - Return the message with the time converted to normal time - { "time": "17/12/2020, 06:18:07" }
 */
function handlePayload(params) {
  const { payload } = params
  let _message = JSON.parse(payload)
  const date = new Date(_message.time * 1000)
  _message.time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(date)
  return JSON.stringify(_message, null, 2)
}

return execute(handlePayload)
