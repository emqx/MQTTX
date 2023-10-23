import { v4 as uuidv4 } from 'uuid'

export const getMessageId = () => `message_${uuidv4()}` as string
