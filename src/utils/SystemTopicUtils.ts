import time from '@/utils/time'
import { MessageModel, ChartDataModel } from '@/views/connections/types'

const res: ChartDataModel = {
  label: '',
  recevied: 0,
  sent: 0,
}

export const handleBytes = (messages: MessageModel): ChartDataModel | null => {
  const { topic, payload } = messages
  res.label = time.getNowDate()
  if (topic.indexOf('/metrics/bytes/received') !== -1) {
    res.recevied = parseInt(payload, 10)
    return res
  }
  if (topic.indexOf('/metrics/bytes/sent') !== -1) {
    res.sent = parseInt(payload, 10)
    return res
  }
  return null
}

export default {}
