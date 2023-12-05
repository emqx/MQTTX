import { v4 as uuidv4 } from 'uuid'
export const getClientId = () => `mqttx_${Math.random().toString(16).substring(2, 10)}` as string
export const getCollectionId = () => `collection_${uuidv4()}` as string
export const getSubscriptionId = () => `scription_${uuidv4()}` as string
export const getMessageId = () => `message_${uuidv4()}` as string
export const ENCRYPT_KEY = Buffer.from('123e4567-e89b-12d3-a456-426614174000').toString('base64')

export default {
  getClientId,
  getCollectionId,
  getSubscriptionId,
  getMessageId,
}
