const getClientId = () => `mqttx_${Math.random().toString(16).substring(2, 10)}`

function getSpecialTypesOption(
  option: number | number[] | undefined,
  index: number,
  defaultVal?: number,
): number | undefined

function getSpecialTypesOption(
  option: boolean | boolean[] | undefined,
  index: number,
  defaultVal?: boolean,
): boolean | undefined

function getSpecialTypesOption(
  option: number | number[] | boolean | boolean[] | undefined,
  index: number,
  defaultVal?: number | boolean,
) {
  const typelist = ['boolean', 'number']
  if (typelist.includes(typeof option))
    return option
  if (Array.isArray(option)) {
    if (typelist.includes(typeof option[index]))
      return option[index]
    if (typelist.includes(typeof option[0]))
      return option[0]
  }
  return defaultVal
}

export { getClientId, getSpecialTypesOption }
