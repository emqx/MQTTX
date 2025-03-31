function random(min, max) {
  return Math.round(Math.random() * (max - min)) + min
}

/**
 * @description: Simulated dynamic temperature and humidity data
 * @param {object} params - The parameters object
 * @param {string} params.payload - Message payload
 * @param {string} params.messageType - Message type, value is 'received' or 'publish'
 * @return {string} - Return a simulated temperature and humidity data - { "temperature": 23, "humidity": 40 }
 */
function handlePayload(params) {
  const { payload } = params
  let _message = JSON.parse(payload || '{}')
  _message.temperature = random(10, 30)
  _message.humidity = random(20, 40)
  return JSON.stringify(_message, null, 2)
}

return execute(handlePayload)
