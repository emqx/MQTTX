import {
  parseNumber,
  parseMessage,
  validateBatchOptions,
  parseFileRead,
  validateClientCount,
  validateMaxInflight,
  parseProtocol,
  parseMQTTVersion,
  parseKeyValues,
  parseQoS,
  parseQoSValue,
  parseConnectOptions,
  parsePublishOptions,
  parseSubscribeOptions,
  parseFormat,
  parseSchemaOptions,
} from '../../utils/parse'
import fs from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import { MQTT_SINGLE_MESSAGE_BYTE_LIMIT } from '../../utils/constants'
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

  describe('parseFileRead', () => {
    let directory: string
    beforeEach(() => {
      directory = fs.mkdtempSync(path.join(tmpdir(), 'mqttx-cli-parse-file-'))
    })
    afterEach(() => {
      fs.rmSync(directory, { recursive: true, force: true })
    })
    it.each([MQTT_SINGLE_MESSAGE_BYTE_LIMIT - 1, MQTT_SINGLE_MESSAGE_BYTE_LIMIT])(
      'checks the file size boundary at %i bytes without reading its contents',
      (size) => {
        const file = path.join(directory, 'payload')
        fs.writeFileSync(file, '')
        fs.truncateSync(file, size)
        const originalRead = fs.readFileSync
        const read = jest.spyOn(fs, 'readFileSync').mockImplementation((...args) => {
          if (args[0] === file) throw new Error('File contents must not be read during argument parsing')
          return originalRead(...args)
        })
        try {
          if (size < MQTT_SINGLE_MESSAGE_BYTE_LIMIT) {
            expect(parseFileRead(file)).toBe(file)
          } else {
            expect(() => parseFileRead(file)).toThrow('Process exited with code 1')
            expect(logWrapper.fail).toHaveBeenCalledWith('File size over 256MB not supported by MQTT.')
          }
          expect(read.mock.calls.some(([target]) => target === file)).toBe(false)
        } finally {
          read.mockRestore()
        }
      },
    )
    it('reports a missing file and exits with failure', () => {
      expect(() => parseFileRead(path.join(directory, 'missing'))).toThrow('Process exited with code 1')
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringContaining('ENOENT'))
      expect(mockExit).toHaveBeenCalledWith(1)
    })
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

  describe('validateMaxInflight', () => {
    it.each([1, 5, 100, 65535])('accepts the valid cap %p', (cap) => {
      expect(() => validateMaxInflight(cap)).not.toThrow()
      expect(mockExit).not.toHaveBeenCalled()
    })

    it.each([0, -1, 1.5, 65536, NaN, Infinity, -Infinity, '5', null, undefined, true])(
      'rejects the invalid cap %p',
      (cap) => {
        expect(() => validateMaxInflight(cap)).toThrow('Process exited with code 1')
        expect(logWrapper.fail).toHaveBeenCalledWith(
          `Invalid max inflight: ${cap}. Expected an integer between 1 and 65535.`,
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

  describe('parseQoSValue', () => {
    it.each([0, 1, 2])('preserves the valid scalar QoS %s', (value) => {
      expect(parseQoSValue(String(value))).toBe(value)
      expect(parseQoSValue(value)).toBe(value)
    })

    it('preserves omitted QoS defaults and per-topic subscription values', () => {
      expect(parsePublishOptions({} as PublishOptions).opts.qos).toBeUndefined()
      expect(parseConnectOptions({ willTopic: 'will' } as ConnectOptions).will).not.toHaveProperty('qos')
      const subscribe = (qos?: number | number[]) =>
        parseSubscribeOptions({ topic: ['first', 'second'], qos } as SubscribeOptions).map((options) => options.qos)
      expect(subscribe()).toEqual([0, 0])
      expect(subscribe([0, 2])).toEqual([0, 2])
      expect(subscribe(1)).toEqual([1, 1])
    })

    it.each(['3', '-1', '0.5', '1.5', 'Infinity', 'NaN', 'invalid', '', '   '])(
      'rejects invalid scalar and variadic QoS %p',
      (value) => {
        expect(() => parseQoSValue(value)).toThrow()
        expect(() => parseQoS(value, undefined)).toThrow()
        expect(logWrapper.fail).toHaveBeenCalledWith(`${value} is not a valid QoS.`)
        expect(mockExit).toHaveBeenCalledWith(1)
      },
    )

    it.each([[3], [-1], [0.5], [null], [false], [[]], [{}], [{ toString: null }]])(
      'rejects invalid QoS %p',
      (value) => {
        expect(() => parseQoSValue(value)).toThrow('Process exited with code 1')
        expect(mockExit).toHaveBeenCalledWith(1)
      },
    )
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

  describe('validateBatchOptions', () => {
    const options = (): PublishOptions => ({
      mqttVersion: 5,
      hostname: '127.0.0.1',
      clientId: 'batch',
      keepalive: 30,
      clean: true,
      reconnectPeriod: 0,
      maximumReconnectTimes: 0,
      topic: 'demo/topic',
      message: 'test',
      qos: 1,
      batch: true,
    })

    it.each([
      [{ mqttVersion: 3 }, 'Batch publishing requires MQTT 5.0 or 3.1.1. MQTT 3.1 is unsupported.'],
      [{ qos: 2 }, 'Batch publishing requires QoS 0 or 1.'],
      [{ mqttVersion: 4, retain: true }, 'MQTT 3.1.1 batch publishing requires RETAIN=0.'],
      [{ payloadFormatIndicator: true }, 'Batch envelopes require Payload Format Indicator 0 or absent.'],
      [
        { userProperties: { 'batch-format': 'v1' } },
        '-up batch-format and batch-size are generated automatically with -b.',
      ],
      [
        { userProperties: { 'batch-size': '2' } },
        '-up batch-format and batch-size are generated automatically with -b.',
      ],
      [
        { batchNegotiate: true, connUserProperties: { 'batch-publish': 'v1' } },
        '--batch-negotiate cannot be combined with -Cup batch-publish.',
      ],
      [{ batchNegotiate: true, mqttVersion: 4 }, '--batch-negotiate requires batch publishing with MQTT 5.0.'],
      [{ batchNegotiate: true, batch: false }, '--batch-negotiate requires batch publishing with MQTT 5.0.'],
      [{ batchMaxItems: 0 }, 'Invalid batch max items: 0. Expected an integer between 1 and 65535.'],
      [{ batchMaxItems: 65536 }, 'Invalid batch max items: 65536. Expected an integer between 1 and 65535.'],
      [{ batchMaxItems: 1.5 }, 'Invalid batch max items: 1.5. Expected an integer between 1 and 65535.'],
      [{ batchMaxBytes: 1023 }, 'Invalid batch max bytes: 1023. Expected an integer between 1024 and 1048576.'],
      [{ batchMaxBytes: 1048577 }, 'Invalid batch max bytes: 1048577. Expected an integer between 1024 and 1048576.'],
      [
        { stdin: true },
        '-b reads items from -m or --file-read (one per line). For piped input use --file-read /dev/stdin.',
      ],
      [
        { multiline: true },
        '-b reads items from -m or --file-read (one per line). For piped input use --file-read /dev/stdin.',
      ],
      [
        { lineMode: true },
        '-b reads items from -m or --file-read (one per line). For piped input use --file-read /dev/stdin.',
      ],
      [{ payloadSize: '1KB' }, '-b reads items from -m or --file-read. -S is unsupported.'],
      [{ split: true, batch: false }, '--split requires -b.'],
      [{ split: true }, '--split requires --file-read.'],
      [{ protobufPath: 'schema.proto' }, 'Batch publishing does not support per-item schema encoding.'],
      [{ topic: '$SYS/demo' }, 'Invalid topic for -b: $SYS/demo (INVALID_BATCH_TOPIC).'],
      [{ topic: '$batch' }, 'Invalid topic for -b: $batch (INVALID_BATCH_TOPIC).'],
    ])('rejects option conflict %j', (override, message) => {
      expect(() => validateBatchOptions({ ...options(), ...override } as PublishOptions, 'pub')).toThrow(
        'Process exited with code 1',
      )
      expect(logWrapper.fail).toHaveBeenCalledWith(message)
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it.each([
      ['$batch/2/demo/topic', ' Try: -t demo/topic'],
      ['$batch/2//demo', ' Try: -t /demo'],
      ['$batch/no-separator', ''],
    ])('rejects prefixed logical topic %s', (topic, suggestion) => {
      expect(() => validateBatchOptions({ ...options(), topic }, 'pub')).toThrow('Process exited with code 1')
      expect(logWrapper.fail).toHaveBeenCalledWith(
        `With -b, -t takes the logical topic; the $batch/{N}/ prefix is added automatically.${suggestion}`,
      )
      expect(() => validateBatchOptions({ ...options(), topic, batch: false }, 'pub')).not.toThrow()
    })

    it('explains unsupported bench splitting', () => {
      expect(() => validateBatchOptions({ ...options(), split: true }, 'benchPub')).toThrow(
        'Process exited with code 1',
      )
      expect(logWrapper.fail).toHaveBeenCalledWith(
        'bench pub -b uses the whole file as one item template. --split is unsupported.',
      )
    })

    it('requires -b for bench item counts', () => {
      expect(() => validateBatchOptions({ ...options(), batch: false, batchItems: 2 }, 'benchPub')).toThrow(
        'Process exited with code 1',
      )
      expect(logWrapper.fail).toHaveBeenCalledWith('-bi requires -b.')
    })

    it('accepts the default and explicit bench item counts with negotiation', () => {
      expect(() => validateBatchOptions(options(), 'benchPub')).not.toThrow()
      expect(() =>
        validateBatchOptions({ ...options(), batchItems: 101, batchNegotiate: true }, 'benchPub'),
      ).not.toThrow()
    })

    it.each([0, 65536, 1.5, NaN, Infinity])('rejects invalid bench item count %p', (batchItems) => {
      expect(() => validateBatchOptions({ ...options(), batchItems }, 'benchPub')).toThrow('Process exited with code 1')
      expect(logWrapper.fail).toHaveBeenCalledWith(
        `Invalid batch items: ${batchItems}. Expected an integer between 1 and 65535.`,
      )
    })
  })

  describe('parseMessage', () => {
    it('replaces the default with the first explicit message', () => {
      expect(parseMessage('first', 'default')).toEqual(['first'])
    })

    it('keeps repeated messages in input order, including empty items', () => {
      expect(parseMessage('', parseMessage('first', 'default'))).toEqual(['first', ''])
    })
  })
})
