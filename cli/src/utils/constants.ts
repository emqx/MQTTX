// Maximum size of a single message in bytes
export const MQTT_SINGLE_MESSAGE_BYTE_LIMIT = 256 * 1024 * 1024

export const DEFAULT_MQTT_PUB_MESSAGE = 'Hello From MQTTX CLI'

// Default unacknowledged messages per benchmark connection
export const DEFAULT_MAX_INFLIGHT = 1000

// MQTT packet identifiers are 16-bit, so at most 65535 can be in flight
export const MAX_INFLIGHT_LIMIT = 65535
