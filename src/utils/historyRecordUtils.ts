import useServices from '@/database/useServices'
import _ from 'lodash'

/** Compare only the settings restored by selecting a publish header. */
export const getMsgHeader = (item: HistoryMessageHeaderModel): HistoryMessageHeaderModel => ({
  ..._.pick(item, ['qos', 'retain', 'topic']),
  batch: Boolean(item.batch),
})

export const hasMessagePayloadID = async (data: HistoryMessagePayloadModel): Promise<string | null> => {
  const { historyMessagePayloadService } = useServices()
  const payloads = await historyMessagePayloadService.getAll(data.connectionId!)
  if (payloads) {
    const res = payloads.find((el: HistoryMessagePayloadModel) => {
      return data.payload === el.payload && data.payloadType === el.payloadType
    })
    return res?.id ?? null
  }
  return null
}

export const hasMessageHeaderID = async (data: HistoryMessageHeaderModel): Promise<string | null> => {
  const { historyMessageHeaderService } = useServices()
  const headers = await historyMessageHeaderService.getAll(data.connectionId!)
  if (headers) {
    const res = headers.find((el: HistoryMessageHeaderModel) => {
      return _.isEqual(getMsgHeader(data), getMsgHeader(el))
    })
    return res?.id ?? null
  }
  return null
}

export default {}
