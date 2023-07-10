import { TranslateResult } from 'vue-i18n'

export default (jsonStrValue: string, warnMessage?: TranslateResult) => {
  try {
    const jsonValue = JSON.parse(jsonStrValue)
    if (jsonValue) {
      return JSON.stringify(jsonValue, null, 2)
    }
    return undefined
  } catch (error) {
    const err = error as Error
    let errorMessage = err.toString()
    if (warnMessage) {
      errorMessage = `${warnMessage} ${errorMessage}`
    }
    throw error
  }
}
