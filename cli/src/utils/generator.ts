const getClientId = () => `mqttx_${Math.random().toString(16).substring(2, 10)}`

const getBooleanOption = (option: boolean | boolean[] | undefined, index: number, defaultVal?: boolean) => {
  if (typeof option === 'boolean') return option
  if (Array.isArray(option)) {
    if (typeof option[index] === 'boolean') return option[index]
    if (typeof option[0] === 'boolean') return option[0]
  }
  return defaultVal
}

const getNumberOption = (option: number | number[] | undefined, index: number, defaultVal?: number) => {
  if (typeof option === 'number') return option
  if (Array.isArray(option)) {
    if (typeof option[index] === 'number') return option[index]
    if (typeof option[0] === 'number') return option[0]
  }
  return defaultVal
}

export { getClientId, getBooleanOption, getNumberOption }
