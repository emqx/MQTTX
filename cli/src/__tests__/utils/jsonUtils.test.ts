import { jsonParse, jsonStringify } from '../../utils/jsonUtils'
import { expect, describe, it } from '@jest/globals'

describe('jsonUtils', () => {
  describe('jsonParse', () => {
    it('should parse JSON with large integers correctly', () => {
      const json = '{"bigInt": 9007199254740991}'
      const result = jsonParse(json)
      expect(result.bigInt.toString()).toBe('9007199254740991')
    })

    it('should parse JSON with floating-point numbers correctly', () => {
      const json = '{"float": 123.456}'
      const result = jsonParse(json)
      expect(result.float.toString()).toBe('123.456')
    })

    it('should throw an error for invalid JSON', () => {
      const invalidJson = '{invalid: json}'
      expect(() => jsonParse(invalidJson)).toThrow()
    })
  })

  describe('jsonStringify', () => {
    it('should stringify objects with large integers correctly', () => {
      const obj = { bigInt: Number.MAX_SAFE_INTEGER }
      const result = jsonStringify(obj)
      expect(result).toBe('{"bigInt":9007199254740991}')
    })

    it('should stringify objects with floating-point numbers correctly', () => {
      const obj = { float: 123.456 }
      const result = jsonStringify(obj)
      expect(result).toBe('{"float":123.456}')
    })

    it('should stringify mixed objects correctly', () => {
      const obj = { bigInt: Number.MAX_SAFE_INTEGER, float: 123.456 }
      const result = jsonStringify(obj)
      expect(result).toBe('{"bigInt":9007199254740991,"float":123.456}')
    })
  })
})
