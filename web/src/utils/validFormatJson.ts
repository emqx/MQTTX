import { Message } from 'element-ui'
import { TranslateResult } from 'vue-i18n'

export default (jsonStrValue: string, warnMessage?: TranslateResult) => {
  try {
    const jsonValue = JSON.parse(jsonStrValue)
    if (jsonValue) {
      return JSON.stringify(jsonValue, null, 2)
    }
    return undefined
  } catch (error) {
    // @ts-ignore
    let errorMessage = error.toString()
    if (warnMessage) {
      errorMessage = `${warnMessage} ${errorMessage}`
    }
    Message.warning(errorMessage)
  }
}
