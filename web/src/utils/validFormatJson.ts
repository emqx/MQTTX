import { Message } from 'element-ui'
import { TranslateResult } from 'vue-i18n'
import { jsonParse, jsonStringify } from './jsonUtils'

export default (jsonStrValue: string, warnMessage?: TranslateResult) => {
  try {
    const jsonValue = jsonParse(jsonStrValue)
    if (jsonValue) {
      return jsonStringify(jsonValue, null, 2)
    }
    return undefined
  } catch (error) {
    let errorMessage = error.toString()
    if (warnMessage) {
      errorMessage = `${warnMessage} ${errorMessage}`
    }
    Message.warning(errorMessage)
  }
}
