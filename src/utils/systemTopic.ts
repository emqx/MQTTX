import moment from 'moment'

const METRICS_BYTES_PREFIX = '/metrics/bytes/'
const RECEIVED_TOPIC = `${METRICS_BYTES_PREFIX}received`
const SENT_TOPIC = `${METRICS_BYTES_PREFIX}sent`

/**
 * Merge received and sent data with close timestamps
 * @param metrics Array of MetricsModel to merge
 * @returns Merged array of MetricsModel
 */
export const mergeMetrics = (metrics: MetricsModel[]): MetricsModel[] => {
  const merged: MetricsModel[] = []
  let current: MetricsModel | null = null

  for (const metric of metrics) {
    if (!current) {
      current = { ...metric }
      continue
    }

    // If timestamps are close (within 1 second), merge the data
    const currentTime = moment(current.label, 'YYYY-MM-DD HH:mm:ss:SSS')
    const metricTime = moment(metric.label, 'YYYY-MM-DD HH:mm:ss:SSS')
    const timeDiff = Math.abs(currentTime.diff(metricTime, 'milliseconds'))

    if (timeDiff <= 1000) {
      // Merge data, keep non-zero values
      current.received = current.received || metric.received
      current.sent = current.sent || metric.sent

      // If both data points are present, add to results and reset current
      if (current.received && current.sent) {
        merged.push({ ...current })
        current = null
      }
    } else {
      // If time difference is too large, save current data and start a new merge
      if (current.received || current.sent) {
        merged.push({ ...current })
      }
      current = { ...metric }
    }
  }

  // Handle the last group of data
  if (current && (current.received || current.sent)) {
    merged.push(current)
  }

  return merged
}

/**
 * Parse and merge traffic metrics from raw messages
 * @param messages Raw MQTT messages to process
 * @returns Merged array of MetricsModel
 */
export const transformTrafficMessages = (messages: MessageModel[]): MetricsModel[] => {
  const metrics = messages
    .sort((a, b) => a.createAt.localeCompare(b.createAt))
    .map((m) => ({
      label: m.createAt,
      received: m.topic.includes(RECEIVED_TOPIC) ? parseFloat(m.payload) : 0,
      sent: m.topic.includes(SENT_TOPIC) ? parseFloat(m.payload) : 0,
    }))

  return mergeMetrics(metrics)
}

/**
 * Calculate average rate of change per second between two values
 * @param current Current value
 * @param previous Previous value
 * @param seconds Time difference in seconds
 * @returns Average rate per second, returns 0 if negative
 */
export const calculateAverageRate = (current: number, previous: number, seconds: number): number => {
  if (seconds <= 0) return 0
  return Math.max(0, (current - previous) / seconds)
}

/**
 * Calculate transmission rate between two measurement points
 * @param current Current MetricsModel
 * @param previous Previous MetricsModel
 * @returns Calculated rate as MetricsModel or null if invalid
 */
export const calculateRate = (current: MetricsModel, previous: MetricsModel): MetricsModel => {
  const currentTime = moment(current.label, 'YYYY-MM-DD HH:mm:ss:SSS')
  const previousTime = moment(previous.label, 'YYYY-MM-DD HH:mm:ss:SSS')

  const timeDiff = currentTime.diff(previousTime, 'seconds')
  if (timeDiff <= 0) return { label: current.label, received: 0, sent: 0 }

  return {
    label: current.label,

    received: calculateAverageRate(current.received, previous.received, timeDiff),
    sent: calculateAverageRate(current.sent, previous.sent, timeDiff),
  }
}

/**
 * Calculate rates for a set of measurement data
 * @param metrics Array of MetricsModel to calculate rates for
 * @returns Array of calculated rates as MetricsModel
 */
export const calculateTrafficRates = (metrics: MetricsModel[]): MetricsModel[] => {
  if (metrics.length < 2) return []
  const rates: MetricsModel[] = []

  for (let i = 1; i < metrics.length; i++) {
    rates.push(calculateRate(metrics[i], metrics[i - 1]))
  }
  return rates
}

export default {}
