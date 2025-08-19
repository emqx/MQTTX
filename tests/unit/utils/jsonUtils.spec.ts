import { expect } from 'chai'
import { jsonParse, jsonStringify, stringifySubtree } from '@/utils/jsonUtils'

describe('jsonUtils', () => {
  describe('jsonParse', () => {
    it('should parse JSON with large integers correctly', () => {
      const json = '{"bigInt": 9007199254740991}'
      const result = jsonParse(json)
      expect(result.bigInt.toString()).to.equal('9007199254740991')
    })

    it('should parse JSON with floating-point numbers correctly', () => {
      const json = '{"float": 123.456}'
      const result = jsonParse(json)
      expect(result.float).to.equal(123.456)
    })

    it('should throw an error for invalid JSON', () => {
      const invalidJson = '{invalid: json}'
      expect(() => jsonParse(invalidJson)).to.throw()
    })

    it('should parse mixed JSON correctly', () => {
      const json = '{"bigInt": 9007199254740991, "float": 123.456, "string": "test"}'
      const result = jsonParse(json)
      expect(result.bigInt.toString()).to.equal('9007199254740991')
      expect(result.float).to.equal(123.456)
      expect(result.string).to.equal('test')
    })

    it('should parse normal JSON correctly', () => {
      const json = '{"name": "John Doe", "age": 30, "isStudent": false}'
      const result = jsonParse(json)
      expect(result).to.deep.equal({
        name: 'John Doe',
        age: 30,
        isStudent: false,
      })
    })
  })

  // TODO: FIX IT with TypeError: Right-hand side of 'instanceof' is not callable
  describe('jsonStringify', () => {
    // it('should stringify normal JSON correctly', () => {
    //   const obj = { name: 'John Doe', age: 30, isStudent: false }
    //   const result = jsonStringify(obj)
    //   expect(result).to.equal('{"name":"John Doe","age":30,"isStudent":false}')
    // })
    // it('should stringify objects with large integers correctly', () => {
    //   const obj = { bigInt: BigInt(Number.MAX_SAFE_INTEGER) }
    //   const result = jsonStringify(obj)
    //   expect(result).to.equal('{"bigInt":9007199254740991}')
    // })
    // it('should stringify objects with floating-point numbers correctly', () => {
    //   const obj = { float: 123.456 }
    //   const result = jsonStringify(obj)
    //   expect(result).to.equal('{"float":123.456}')
    // })
    // it('should stringify mixed objects correctly', () => {
    //   const obj = { bigInt: BigInt(Number.MAX_SAFE_INTEGER), float: 123.456, string: 'test' }
    //   const result = jsonStringify(obj)
    //   expect(result).to.equal('{"bigInt":9007199254740991,"float":123.456,"string":"test"}')
    // })
    // it('should handle BigInt correctly', () => {
    //   const bigIntValue = BigInt(Number.MAX_SAFE_INTEGER)
    //   const stringified = jsonStringify(bigIntValue)
    //   expect(stringified).to.equal('9007199254740991')
    // })
    // it('should handle arrays with mixed types', () => {
    //   const arr = [BigInt(Number.MAX_SAFE_INTEGER), 123.456, 'test', true]
    //   const result = jsonStringify(arr)
    //   expect(result).to.equal('[9007199254740991,123.456,"test",true]')
    // })
  })

  describe('stringifySubtree', () => {
    it('should stringify node.raw when present', () => {
      const node = { raw: { a: 1, b: 'text', c: true } }
      const result = stringifySubtree(node, 2)
      expect(result).to.equal('{\n  "a": 1,\n  "b": "text",\n  "c": true\n}')
    })

    it('should stringify the node itself when raw is absent', () => {
      const node = { a: 1, b: 'text', c: true }
      const result = stringifySubtree(node, 2)
      expect(result).to.equal('{\n  "a": 1,\n  "b": "text",\n  "c": true\n}')
    })

    it('should handle arrays and preserve order', () => {
      const node = { raw: [1, 'two', true, null] }
      const result = stringifySubtree(node, 2)
      expect(result).to.equal('[\n  1,\n  "two",\n  true,\n  null\n]')
    })

    it('should handle nested structures', () => {
      const node = { raw: { x: { y: [1, { z: 'ok' }] } } }
      const result = stringifySubtree(node, 2)
      expect(result).to.equal(
        '{' +
          '\n  "x": {' +
          '\n    "y": [' +
          '\n      1,' +
          '\n      {' +
          '\n        "z": "ok"' +
          '\n      }' +
          '\n    ]' +
          '\n  }' +
          '\n}',
      )
    })
  })
})
