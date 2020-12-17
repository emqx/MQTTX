/**
 * Convert timestamp to normal time.
 * @return Return the UTC time - { "time": "2020-12-17 14:18:07" }
 * @param value, MQTT Payload - { "time": 1608185887 }
 */

function handleTimestamp(value) {
  let _value = value
  if (typeof value === 'string') {
    _value = JSON.parse(value)
  }
  // East Eight District needs an additional 8 hours
  const date = new Date(_value.time * 1000 + 8 * 3600 * 1000)
  _value.time = date.toJSON().substr(0, 19).replace('T', ' ')
  return JSON.stringify(_value, null, 2)
}

execute(handleTimestamp)
