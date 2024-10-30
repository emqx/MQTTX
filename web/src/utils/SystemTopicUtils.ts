import time from '@/utils/time'

const res: MetricsModel = {
  label: '',
  received: 0,
  sent: 0,
}

const getData = (message: MessageModel, condition: string): string | null => {
  const { topic, payload } = message
  if (topic.indexOf(condition) !== -1) {
    return payload
  }
  return null
}

export const getBytes = (message: MessageModel): MetricsModel | null => {
  res.label = time.getNowDate()
  const _received = getData(message, '/metrics/bytes/received')
  if (_received) {
    res.received = parseInt(_received, 10)
    return res
  }
  const _sent = getData(message, '/metrics/bytes/sent')
  if (_sent) {
    res.sent = parseInt(_sent, 10)
    return res
  }
  return null
}

export const getUptime = (message: MessageModel): string | null => getData(message, '/uptime')

export const getVersion = (message: MessageModel): string | null => getData(message, '/version')

export default {}
