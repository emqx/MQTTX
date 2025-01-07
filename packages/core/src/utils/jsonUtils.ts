import JSONbig from 'json-bigint'

const JSONbigNative = JSONbig({ useNativeBigInt: true })

export const jsonParse: typeof JSON.parse = (...args) => {
  try {
    // When JSON only contains integers, use the native bigint type.
    return JSONbigNative.parse(...args)
  } catch {
    try {
      // When JSON contains floating-point numbers, use the bignumber library.
      // The numbers in the parsed JSON Object will be represented as BigNumber Objects.
      return JSONbig.parse(...args)
    } catch {
      // To verify the validity of the JSON string and throw an error if it's invalid.
      return JSON.parse(...args)
    }
  }
}

export function jsonStringify(...args: Parameters<typeof JSONbigNative.stringify>): ReturnType<typeof JSONbigNative.stringify> {
  try {
    // When JSON only contains integers, use the native bigint type.
    return JSONbigNative.stringify(...args)
  } catch {
    // When JSON contains floating-point numbers, use the bignumber library.
    // Integers will be represented in scientific notation.
    return JSONbig.stringify(...args)
  }
}
