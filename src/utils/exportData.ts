const typeNull = 'TYPE_NULL'
const typeUndefined = 'TYPE_UNDEFINED'
const emptyString = 'EMPTY_STRING'
const emptyArray = 'EMPTY_ARRAY'
const emptyObject = 'EMPTY_OBJECT'

const specialDataTypes = [typeNull, typeUndefined, emptyString, emptyArray, emptyObject]

const replaceSpecialDataTypes = (jsonString: string) => {
  return jsonString
    .replace(/: null/g, `: "${typeNull}"`)
    .replace(/: undefined/g, `: "${typeUndefined}"`)
    .replace(/: ""/g, `: "${emptyString}"`)
    .replace(/: \[\]/g, `: "${emptyArray}"`)
    .replace(/: \{\}/g, `: "${emptyObject}"`)
}

const recoverSpecialDataTypes = (value: string) => {
  switch (value) {
    case typeNull:
      return null
    case typeUndefined:
      return undefined
    case emptyString:
      return ''
    case emptyArray:
      return []
    case emptyObject:
      return {}
    default:
      return value
  }
}

export {
  typeNull,
  typeUndefined,
  emptyString,
  emptyArray,
  emptyObject,
  specialDataTypes,
  replaceSpecialDataTypes,
  recoverSpecialDataTypes,
}
