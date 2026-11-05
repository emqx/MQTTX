import {
  parseNumber,
  validateClientCount,
  parseProtocol,
  parseMQTTVersion,
  parseKeyValues,
  parseQoS,
  parseFormat,
  parseSchemaOptions,
} from '../../utils/parse'
import logWrapper from '../../utils/logWrapper'
import { expect, jest } from '@jest/globals'

// Mock the logWrapper and process.exit
jest.mock('../../utils/logWrapper', () => ({
  fail: jest.fn(),
}))
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
  throw new Error(`Process exited with code ${code}`)
})

describe('parse utilities', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('parseNumber', () => {
    it('should parse valid numbers', () => {
      expect(parseNumber('42')).toBe(42)
      expect(parseNumber('-3.14')).toBe(-3.14)
    })

    it('should throw an error for invalid numbers', () => {
      expect(() => parseNumber('not a number')).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith('not a number is not a number.')
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('validateClientCount', () => {
    it.each([1, 2, 1000, 0xffffffff])('accepts the valid client count %p', (count) => {
      expect(() => validateClientCount(count)).not.toThrow()
      expect(logWrapper.fail).not.toHaveBeenCalled()
      expect(mockExit).not.toHaveBeenCalled()
    })

    it.each([-1, 0, 1.5, NaN, Infinity, -Infinity, 0x100000000, Number.MAX_SAFE_INTEGER, '1', null, undefined, true])(
      'rejects the invalid client count %p',
      (count) => {
        expect(() => validateClientCount(count)).toThrow('Process exited with code 1')
        expect(logWrapper.fail).toHaveBeenCalledWith(
          `Invalid client count: ${count}. Expected an integer between 1 and 4294967295.`,
        )
        expect(mockExit).toHaveBeenCalledWith(1)
      },
    )
  })

  describe('parseProtocol', () => {
    it('should accept valid protocols', () => {
      expect(parseProtocol('mqtt')).toBe('mqtt')
      expect(parseProtocol('mqtts')).toBe('mqtts')
      expect(parseProtocol('ws')).toBe('ws')
      expect(parseProtocol('wss')).toBe('wss')
    })

    it('should throw an error for invalid protocols', () => {
      expect(() => parseProtocol('http')).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith('Only mqtt, mqtts, ws and wss are supported.')
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('parseMQTTVersion', () => {
    it('should parse valid MQTT versions', () => {
      expect(parseMQTTVersion('3.1')).toBe(3)
      expect(parseMQTTVersion('3.1.1')).toBe(4)
      expect(parseMQTTVersion('5')).toBe(5)
      expect(parseMQTTVersion('5.0')).toBe(5)
    })

    it.each(['4.0', '3.1 .1', '3.1.1-extra', '\u00a0'])('should reject invalid MQTT version %p', (value) => {
      expect(() => parseMQTTVersion(value)).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith('Not a valid MQTT version.')
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it.each<[string, number]>([
      ['3.1\u00a0', 3],
      ['\u00a03.1.1\u00a0', 4],
      [' \t5\n', 5],
      ['\u00a05.0\u00a0', 5],
    ])('should accept surrounding whitespace in MQTT version %p', (value, expected) => {
      expect(parseMQTTVersion(value)).toBe(expected)
    })
  })

  describe('parseKeyValues', () => {
    it('should parse a single key-value pair', () => {
      expect(parseKeyValues('key: value')).toEqual({ key: 'value' })
    })

    it('should add to existing key-value pairs', () => {
      const previous = { existingKey: 'existingValue' }
      expect(parseKeyValues('newKey: newValue', previous)).toEqual({
        existingKey: 'existingValue',
        newKey: 'newValue',
      })
    })

    it('should handle multiple values for the same key', () => {
      const previous = { key: 'value1' }
      expect(parseKeyValues('key: value2', previous)).toEqual({ key: ['value1', 'value2'] })
    })

    it('should throw an error for invalid key-value pairs', () => {
      expect(() => parseKeyValues('invalid')).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(
        'Invalid key-value pair: "invalid". Expected format is "key: value".',
      )
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('parseQoS', () => {
    it('should parse valid QoS values', () => {
      expect(parseQoS('0', undefined)).toEqual([0])
      expect(parseQoS('1', [0])).toEqual([0, 1])
      expect(parseQoS('2', [0, 1])).toEqual([0, 1, 2])
    })

    it('should throw an error for invalid QoS values', () => {
      expect(() => parseQoS('3', undefined)).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith('3 is not a valid QoS.')
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('parseFormat', () => {
    it('should accept valid format types', () => {
      expect(parseFormat('base64')).toBe('base64')
      expect(parseFormat('json')).toBe('json')
      expect(parseFormat('hex')).toBe('hex')
      expect(parseFormat('cbor')).toBe('cbor')
      expect(parseFormat('binary')).toBe('binary')
      expect(parseFormat('msgpack')).toBe('msgpack')
    })

    it('should throw an error for invalid format types', () => {
      expect(() => parseFormat('xml')).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith('Not a valid format type.')
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('parseSchemaOptions', () => {
    it('should return protobuf schema options when protobuf parameters are provided', () => {
      expect(parseSchemaOptions('path/to/proto', 'MessageName')).toEqual({
        type: 'protobuf',
        protobufPath: 'path/to/proto',
        protobufMessageName: 'MessageName',
      })
    })

    it('should return avro schema options when avsc path is provided', () => {
      expect(parseSchemaOptions(undefined, undefined, 'path/to/avsc')).toEqual({
        type: 'avro',
        avscPath: 'path/to/avsc',
      })
    })

    it('should return undefined when no schema options are provided', () => {
      expect(parseSchemaOptions()).toBeUndefined()
    })
  })
})
