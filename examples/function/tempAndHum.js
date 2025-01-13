function random(min, max) {
  return Math.round(Math.random() * (max - min)) + min
}

/**
 * @description: Simulated dynamic switch command
 * @param {string} message - Message payload
 * @return {string} - Return a simulated temperature and humidity data - { "temperature": 23, "humidity": 40 }
 */
function handlePayload(message) {
  let _message = JSON.parse(message || '{}')
  _message.temperature = random(10, 30)
  _message.humidity = random(20, 40)
  return JSON.stringify(_message, null, 2)
}

return execute(handlePayload)
