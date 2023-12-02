const JSONBigNumber = require('json-bigint')
const JSONBigInt = require('json-bigint')({ useNativeBigInt: true })

export const jsonParse: typeof JSON.parse = (...args: any[]) => {
  try {
    // When JSON only contains integers, use the native bigint type.
    return JSONBigInt.parse(...args)
  } catch (_error) {
    // When JSON contains floating-point numbers, use the bignumber library.
    // The numbers in the parsed JSON Object will be represented as BigNumber Objects.
    return JSONBigNumber.parse(...args)
  }
}

export const jsonStringify: typeof JSON.stringify = (...args: any[]) => {
  try {
    // When JSON only contains integers, use the native bigint type.
    return JSONBigInt.stringify(...args)
  } catch (_error) {
    // When JSON contains floating-point numbers, use the bignumber library.
    // Integers will be represented in scientific notation.
    return JSONBigNumber.stringify(...args)
  }
}
