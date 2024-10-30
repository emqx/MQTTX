import time from '@/utils/time'

const METRICS_BYTES_PREFIX = '/metrics/bytes/'
const RECEIVED_TOPIC = `${METRICS_BYTES_PREFIX}received`
const SENT_TOPIC = `${METRICS_BYTES_PREFIX}sent`
const UPTIME_TOPIC = '/uptime'
const VERSION_TOPIC = '/version'

/**
 * Check if a topic is a system topic
 * @param topic The MQTT topic to check
 * @returns True if the topic starts with '$SYS', false otherwise
 */
export const isSystemTopic = (topic: string): boolean => topic.startsWith('$SYS')

/**
 * Extract data from a message for a given topic
 * @param message The MQTT message to extract data from
 * @param topic The topic to extract data for
 * @returns The extracted data as a string, or null if the topic is not found in the message
 */
export const extractData = (message: MessageModel, topic: string): string | null => {
  return message.topic.includes(topic) ? message.payload : null
}

/**
 * Parse traffic metrics data
 * @param message The MQTT message to parse
 * @returns The parsed data as a MetricsModel, or null if the message is a system topic
 */
export const getTrafficMetrics = (message: MessageModel): MetricsModel | null => {
  if (!isSystemTopic(message.topic)) {
    return null
  }

  const metrics: MetricsModel = {
    label: time.getNowDate(),
    recevied: 0,
    sent: 0,
  }

  // Try to parse received bytes
  const receivedBytes = extractData(message, RECEIVED_TOPIC)
  if (receivedBytes) {
    metrics.recevied = parseInt(receivedBytes, 10)
    return metrics
  }

  // Try to parse sent bytes
  const sentBytes = extractData(message, SENT_TOPIC)
  if (sentBytes) {
    metrics.sent = parseInt(sentBytes, 10)
    return metrics
  }

  return null
}

/**
 * Get the uptime from a message
 * @param message The MQTT message to get the uptime from
 * @returns The uptime as a string, or null if the topic is not found in the message
 */
export const getUptime = (message: MessageModel): string | null => extractData(message, UPTIME_TOPIC)

/**
 * Get the version from a message
 * @param message The MQTT message to get the version from
 * @returns The version as a string, or null if the topic is not found in the message
 */
export const getVersion = (message: MessageModel): string | null => extractData(message, VERSION_TOPIC)

export default {}
