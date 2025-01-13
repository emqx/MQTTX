/**
 * Convert timestamp to normal time
 * @param {string} message - Message payload - { "time": 1608185887 }
 * @return {string} - Return the message with the time converted to normal time - { "time": "17/12/2020, 06:18:07" }
 */
function handlePayload(message) {
  let _message = JSON.parse(message)
  const date = new Date(_message.time * 1000)
  _message.time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(date)
  return JSON.stringify(_message, null, 2)
}

return execute(handlePayload)
