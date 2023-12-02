import { jsonParse, jsonStringify } from './jsonUtils'

export default (jsonStrValue: string) => {
  try {
    const jsonValue = jsonParse(jsonStrValue)
    if (jsonValue) {
      return jsonStringify(jsonValue, null, 2)
    }
    return undefined
  } catch (error) {
    throw error
  }
}
