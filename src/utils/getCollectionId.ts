import { v4 as uuidv4 } from 'uuid'
export default (): string => `collection_${uuidv4()}` as string
