/**
 * Simulated temperature and humidity reporting
 * @return Return a simulated temperature and humidity JSON data - { "temperature": 23, "humidity": 40 }
 * @param value, MQTT Payload - {}
 */

function random(min, max) {
  return Math.round(Math.random() * (max - min)) + min
}

function handlePayload(value) {
  let _value = value
  if (typeof value === 'string') {
    _value = JSON.parse(value)
  }
  _value.temperature = random(10, 30)
  _value.humidity = random(20, 40)
  return JSON.stringify(_value, null, 2)
}

execute(handlePayload)
