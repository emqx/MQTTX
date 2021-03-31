import { v4 as uuidv4 } from 'uuid'
export default (): string => {
  return `collection_${uuidv4()}` as string
}
