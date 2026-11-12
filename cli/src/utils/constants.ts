// Maximum size of a single message in bytes
export const MQTT_SINGLE_MESSAGE_BYTE_LIMIT = 256 * 1024 * 1024

export const DEFAULT_MQTT_PUB_MESSAGE = 'Hello From MQTTX CLI'

// Default unacknowledged messages per benchmark connection
export const DEFAULT_MAX_INFLIGHT = 1000

// MQTT packet identifiers are 16-bit, so at most 65535 can be in flight
export const MAX_INFLIGHT_LIMIT = 65535

// Exit code after Ctrl+C: 128 + SIGINT (2), as shells report it
export const SIGINT_EXIT_CODE = 130

export const DEFAULT_BATCH_ITEMS = 256

export const MAX_BATCH_ITEMS = 65535

// Each item length uses two bytes.
export const MAX_BATCH_ITEM_BYTES = 65535

export const MIN_BATCH_BYTES = 1024

export const MAX_BATCH_BYTES = 1048576

export const DEFAULT_BATCH_LIMITS = { maxItems: DEFAULT_BATCH_ITEMS, maxBytes: 65536 }

// Bench batches use MQTT limits.
export const PROTOCOL_BATCH_LIMITS = { maxItems: MAX_BATCH_ITEMS, maxBytes: MQTT_SINGLE_MESSAGE_BYTE_LIMIT - 1 }

// MQTT topic lengths use two bytes.
export const MAX_MQTT_TOPIC_BYTES = 65535
