import { v4 as uuidv4 } from 'uuid'

export const getClientId = () => `mqttx_${Math.random().toString(16).substring(2, 10)}`
export const getCollectionId = () => `collection_${uuidv4()}`
export const getSubscriptionId = () => `scription_${uuidv4()}`
export const getMessageId = () => `message_${uuidv4()}`
export const getCopilotMessageId = () => `copilot_${uuidv4()}`

export default {
  getClientId,
  getCollectionId,
  getSubscriptionId,
  getMessageId,
}
