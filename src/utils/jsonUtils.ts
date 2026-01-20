const JSONBigNumber = require('json-bigint')
const JSONBigInt = require('json-bigint')({ useNativeBigInt: true })

export const jsonParse: typeof JSON.parse = (...args: any[]) => {
  try {
    // When JSON only contains integers, use the native bigint type.
    return JSONBigInt.parse(...args)
  } catch {
    try {
      // When JSON contains floating-point numbers, use the bignumber library.
      // The numbers in the parsed JSON Object will be represented as BigNumber Objects.
      return JSONBigNumber.parse(...args)
    } catch {
      // To verify the validity of the JSON string and throw an error if it's invalid.
      return JSON.parse(args[0], args[1])
    }
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

/**
 * Interface representing a node-like object for ECharts JSON tree.
 * The node may contain a 'raw' property holding the original data,
 * along with any other arbitrary properties.
 */
export interface EChartsJsonTreeNodeLike {
  raw?: any
  [key: string]: any
}

/**
 * Stringifies the subtree of a given node-like object.
 * If the object has a 'raw' property, it will be stringified;
 * otherwise, the object itself is stringified.
 *
 * @param nodeLike - The node-like object to stringify.
 * @param space - Number of spaces to use for indentation (default: 2).
 * @returns The JSON string representation of the subtree.
 */
export function stringifySubtree(nodeLike: EChartsJsonTreeNodeLike, space: number = 2): string {
  // Use the 'raw' property if it exists, otherwise use the node itself
  const raw = nodeLike && Object.prototype.hasOwnProperty.call(nodeLike, 'raw') ? nodeLike.raw : nodeLike
  try {
    return jsonStringify(raw, null, space)
  } catch (_err) {
    return JSON.stringify(raw, null, space)
  }
}

/**
 * Recursively converts BigInt and BigNumber instances to plain numbers or strings,
 * so that the result can be safely used with ECharts and other consumers.
 *
 * @param obj - The object to convert.
 * @returns The plain object with BigInt/BigNumber converted.
 */
export function toPlainObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  if (
    typeof obj === 'object' &&
    obj !== null &&
    obj.constructor &&
    (obj.constructor.name === 'BigNumber' || obj.constructor.name === 'BN')
  ) {
    if (typeof obj.toString === 'function') {
      return obj.toString()
    }
    return String(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => toPlainObject(item))
  }
  if (typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = toPlainObject(obj[key])
      }
    }
    return result
  }
  return obj
}
