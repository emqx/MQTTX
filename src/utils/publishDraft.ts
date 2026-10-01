export interface PublishDraft {
  payload: string
  topic: string
  qos: QoS
  retain: boolean
  payloadType: PayloadType
}

export const getDefaultPublishDraft = (): PublishDraft => ({
  payload: JSON.stringify({ msg: 'hello' }, null, 2),
  topic: '',
  qos: 0,
  retain: false,
  payloadType: 'JSON',
})
