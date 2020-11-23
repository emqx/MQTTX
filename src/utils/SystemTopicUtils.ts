import time from '@/utils/time'
import { MessageModel, ChartDataModel } from '@/views/connections/types'

const res: ChartDataModel = {
  label: '',
  recevied: 0,
  sent: 0,
}

const getData = (message: MessageModel, condition: string): string | null => {
  const { topic, payload } = message
  if (topic.indexOf(condition) !== -1) {
    return payload
  }
  return null
}

export const getBytes = (message: MessageModel): ChartDataModel | null => {
  res.label = time.getNowDate()
  const _recevied = getData(message, '/metrics/bytes/received')
  if (_recevied) {
    res.recevied = parseInt(_recevied, 10)
    return res
  }
  const _sent = getData(message, '/metrics/bytes/sent')
  if (_sent) {
    res.sent = parseInt(_sent, 10)
    return res
  }
  return null
}

export const getUptime = (message: MessageModel): string | null => {
  return getData(message, '/uptime')
}

export const getVersion = (message: MessageModel): string | null => {
  return getData(message, '/version')
}

export default {}
