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

    it('should handle invalid BigInt', () => {
      const node = { raw: { a: () => {} } }
      const result = stringifySubtree(node, 2)
      expect(result).to.equal('{}')
    })

    it('should stringify node.raw as array with very large/small numbers', () => {
      const node = { raw: [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MAX_VALUE, Number.MIN_VALUE] }
      const result = stringifySubtree(node, 2)
      expect(result).to.equal(
        '[\n' +
          `  ${Number.MAX_SAFE_INTEGER},\n` +
          `  ${Number.MIN_SAFE_INTEGER},\n` +
          `  ${Number.MAX_VALUE},\n` +
          `  ${Number.MIN_VALUE}\n` +
          ']',
      )
    })
  })
})

describe('toPlainObject', () => {
  const { toPlainObject } = require('@/utils/jsonUtils')

  it('should return null or undefined as is', () => {
    expect(toPlainObject(null)).to.equal(null)
    expect(toPlainObject(undefined)).to.equal(undefined)
  })

  it('should convert bigint to string', () => {
    if (typeof BigInt !== 'undefined') {
      expect(toPlainObject(BigInt('12345678901234567890'))).to.equal('12345678901234567890')
    }
  })

  it('should convert BigNumber-like objects to string', () => {
    const bigNumber = { constructor: { name: 'BigNumber' }, toString: () => '99999999999999999999' }
    expect(toPlainObject(bigNumber)).to.equal('99999999999999999999')
  })

  it('should convert BN-like objects to string', () => {
    const bn = { constructor: { name: 'BN' }, toString: () => '1234567890' }
    expect(toPlainObject(bn)).to.equal('1234567890')
  })

  it('should convert array of bigints and BigNumbers', () => {
    const arr = [1, BigInt ? BigInt('2') : 2, { constructor: { name: 'BigNumber' }, toString: () => '3' }, 'str']
    const result = toPlainObject(arr)
    if (typeof BigInt !== 'undefined') {
      expect(result).to.deep.equal([1, '2', '3', 'str'])
    } else {
      expect(result).to.deep.equal([1, 2, '3', 'str'])
    }
  })

  it('should recursively convert nested objects', () => {
    const input = {
      a: 1,
      b: BigInt ? BigInt('10') : 10,
      c: {
        d: { constructor: { name: 'BigNumber' }, toString: () => '20' },
        e: [BigInt ? BigInt('30') : 30, { constructor: { name: 'BN' }, toString: () => '40' }],
      },
    }
    const expected = {
      a: 1,
      b: typeof BigInt !== 'undefined' ? '10' : 10,
      c: {
        d: '20',
        e: [typeof BigInt !== 'undefined' ? '30' : 30, '40'],
      },
    }
    expect(toPlainObject(input)).to.deep.equal(expected)
  })

  it('should handle objects with no prototype', () => {
    const obj = Object.create(null)
    obj.x = 1
    obj.y = BigInt ? BigInt('2') : 2
    const result = toPlainObject(obj)
    if (typeof BigInt !== 'undefined') {
      expect(result).to.deep.equal({ x: 1, y: '2' })
    } else {
      expect(result).to.deep.equal({ x: 1, y: 2 })
    }
  })

  it('should not convert plain numbers, strings, booleans', () => {
    expect(toPlainObject(42)).to.equal(42)
    expect(toPlainObject('hello')).to.equal('hello')
    expect(toPlainObject(true)).to.equal(true)
    expect(toPlainObject(false)).to.equal(false)
  })

  it('should skip properties from prototype chain', () => {
    function Parent() {}
    Parent.prototype.inherited = BigInt ? BigInt('100') : 100
    const obj = new (Parent as any)()
    obj.own = BigInt ? BigInt('200') : 200
    const result = toPlainObject(obj)
    if (typeof BigInt !== 'undefined') {
      expect(result).to.deep.equal({ own: '200' })
    } else {
      expect(result).to.deep.equal({ own: 200 })
    }
  })

  it('should handle circular references gracefully (should throw)', () => {
    const obj: any = { a: 1 }
    obj.self = obj
    expect(() => toPlainObject(obj)).to.throw()
  })
})
