export default (jsonStrValue: string) => {
  try {
    const jsonValue = JSON.parse(jsonStrValue)
    if (jsonValue) {
      return JSON.stringify(jsonValue, null, 2)
    }
    return undefined
  } catch (error) {
    throw error
  }
}
