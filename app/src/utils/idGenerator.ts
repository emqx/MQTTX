import { v4 as uuidv4 } from 'uuid'
export const getClientId = () => `mqttx_${Math.random().toString(16).substr(2, 8)}` as string
export const getCollectionId = () => `collection_${uuidv4()}` as string
export const getSubscriptionId = () => `scription_${uuidv4()}` as string
export const getMessageId = () => `message_${uuidv4()}` as string

export default {
  getClientId,
  getCollectionId,
  getSubscriptionId,
  getMessageId,
}
