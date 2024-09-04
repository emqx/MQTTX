import { expect, describe, it, jest } from '@jest/globals'
import convertPayload from '../../utils/convertPayload'
import { jsonParse, jsonStringify } from '../../utils/jsonUtils'
import cbor from 'cbor'
import { basicLog } from '../../utils/logWrapper'

jest.mock('../../utils/jsonUtils')
jest.mock('cbor')
jest.mock('../../utils/logWrapper')

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
  throw new Error(`Process.exit called with code ${code}`)
})

describe('convertPayload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should decode string payload correctly', () => {
    const input = Buffer.from('Hello, MQTT!')
    const result = convertPayload(input)
    expect(result).toBe('Hello, MQTT!')
  })

  it('should encode string payload correctly', () => {
    const input = 'Hello, MQTT!'
    const result = convertPayload(input, undefined, 'encode')
    expect(result).toEqual(Buffer.from('Hello, MQTT!'))
  })

  it('should decode base64 payload', () => {
    const input = Buffer.from('Hello, MQTT!')
    const result = convertPayload(input, 'base64')
    expect(result).toBe('SGVsbG8sIE1RVFQh')
  })

  it('should encode base64 payload', () => {
    const input = 'SGVsbG8sIE1RVFQh'
    const result = convertPayload(input, 'base64', 'encode')
    expect(result).toEqual(Buffer.from('Hello, MQTT!'))
  })

  it('should decode JSON payload', () => {
    const jsonInput = '{"key":"value"}'
    const parsedJson = { key: 'value' }
    ;(jsonParse as jest.Mock).mockReturnValue(parsedJson)
    ;(jsonStringify as jest.Mock).mockReturnValue('{\n  "key": "value"\n}')

    const result = convertPayload(Buffer.from(jsonInput), 'json')
    expect(result).toBe('{\n  "key": "value"\n}')
    expect(jsonParse).toHaveBeenCalledWith(jsonInput)
    expect(jsonStringify).toHaveBeenCalledWith(parsedJson, null, 2)
  })

  it('should encode JSON payload', () => {
    const jsonInput = '{"key":"value"}'
    const parsedJson = { key: 'value' }
    ;(jsonParse as jest.Mock).mockReturnValue(parsedJson)
    ;(jsonStringify as jest.Mock).mockReturnValue('{"key":"value"}')

    const result = convertPayload(jsonInput, 'json', 'encode')
    expect(result).toEqual(Buffer.from('{"key":"value"}'))
    expect(jsonParse).toHaveBeenCalledWith(jsonInput)
    expect(jsonStringify).toHaveBeenCalledWith(parsedJson)
  })

  it('should decode hex payload', () => {
    const input = Buffer.from('48656c6c6f2c204d515454', 'hex')
    const result = convertPayload(input, 'hex')
    expect(result).toBe('4865 6c6c 6f2c 204d 5154 54')
  })

  it('should encode hex payload', () => {
    const input = '48 65 6c 6c 6f 2c 20 4d 51 54 54'
    const result = convertPayload(input, 'hex', 'encode')
    expect(result).toEqual(Buffer.from('48656c6c6f2c204d515454', 'hex'))
  })

  it('should decode CBOR payload', () => {
    const cborInput = Buffer.from([0xa1, 0x63, 0x6b, 0x65, 0x79, 0x65, 0x76, 0x61, 0x6c, 0x75, 0x65])
    const decodedCbor = { key: 'value' }
    ;(cbor.decodeFirstSync as jest.Mock).mockReturnValue(decodedCbor)
    ;(jsonStringify as jest.Mock).mockReturnValue('{\n  "key": "value"\n}')

    const result = convertPayload(cborInput, 'cbor')
    expect(result).toBe('{\n  "key": "value"\n}')
    expect(cbor.decodeFirstSync).toHaveBeenCalledWith(cborInput)
    expect(jsonStringify).toHaveBeenCalledWith(decodedCbor, null, 2)
  })

  it('should encode CBOR payload', () => {
    const jsonInput = '{"key":"value"}'
    const encodedCbor = Buffer.from([0xa1, 0x63, 0x6b, 0x65, 0x79, 0x65, 0x76, 0x61, 0x6c, 0x75, 0x65])
    ;(cbor.encodeOne as jest.Mock).mockReturnValue(encodedCbor)

    const result = convertPayload(jsonInput, 'cbor', 'encode')
    expect(result).toEqual(encodedCbor)
    expect(cbor.encodeOne).toHaveBeenCalledWith(JSON.parse(jsonInput))
  })

  it('should handle binary payload', () => {
    const input = Buffer.from([0x01, 0x02, 0x03])
    const result = convertPayload(input, 'binary')
    expect(result).toEqual(input)
  })

  it('should handle errors in JSON conversion', () => {
    const invalidJson = '{"key": invalid}'
    ;(jsonParse as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid JSON')
    })
    ;(basicLog.error as jest.Mock).mockImplementation(() => {})

    const result = convertPayload(invalidJson, 'json', 'decode')
    expect(result).toContain('{"key": invalid}')
    expect(basicLog.error).toHaveBeenCalled()
  })

  it('should handle errors in CBOR conversion', () => {
    const invalidCbor = Buffer.from([0x01, 0x02, 0x03])
    ;(cbor.decodeFirstSync as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid CBOR')
    })
    ;(basicLog.error as jest.Mock).mockImplementation(() => {})

    const result = convertPayload(invalidCbor, 'cbor', 'decode')
    expect(result).toContain('\u0001\u0002\u0003')
    expect(basicLog.error).toHaveBeenCalled()
  })

  it('should convert from base64 to JSON', () => {
    const base64Input = 'eyJrZXkiOiJ2YWx1ZSJ9'
    const jsonOutput = '{\n  "key": "value"\n}'

    ;(jsonParse as jest.Mock).mockReturnValue({ key: 'value' })
    ;(jsonStringify as jest.Mock).mockReturnValue(jsonOutput)

    const result = convertPayload(Buffer.from(base64Input, 'base64'), 'json')
    expect(result).toBe(jsonOutput)
  })

  it('should convert from hex to JSON', () => {
    const hexInput = '7b226k6579223a2276616c7565227d'
    const jsonOutput = '{\n  "key": "value"\n}'

    ;(jsonParse as jest.Mock).mockReturnValue({ key: 'value' })
    ;(jsonStringify as jest.Mock).mockReturnValue(jsonOutput)

    const result = convertPayload(Buffer.from(hexInput, 'hex'), 'json')
    expect(result).toBe(jsonOutput)
  })

  it('should convert from JSON to hex', () => {
    const jsonInput = '{"key":"value"}'
    const hexOutput = '7b0a2020226b6579223a202276616c7565220a7d'

    const result = convertPayload(jsonInput, 'json', 'encode')
    expect(result.toString('hex')).toBe(hexOutput)
  })

  it('should convert from CBOR to base64', () => {
    const cborInput = Buffer.from([0xa1, 0x63, 0x6b, 0x65, 0x79, 0x65, 0x76, 0x61, 0x6c, 0x75, 0x65])
    const base64Output = 'oWNrZXlldmFsdWU='

    const result = convertPayload(cborInput, 'base64')
    expect(result).toBe(base64Output)
  })

  it('should convert from base64 to CBOR', () => {
    const base64Input = 'oWNrZXlldmFsdWU='
    const cborOutput = Buffer.from([0xa1, 0x63, 0x6b, 0x65, 0x79, 0x65, 0x76, 0x61, 0x6c, 0x75, 0x65])

    ;(cbor.encodeOne as jest.Mock).mockReturnValue(cborOutput)

    const result = convertPayload(base64Input, 'base64', 'encode')
    expect(result).toEqual(cborOutput)
  })

  it('should convert from hex to base64', () => {
    const hexInput = '48656c6c6f2c204d515454'
    const base64Output = 'SGVsbG8sIE1RVFQ='

    const result = convertPayload(Buffer.from(hexInput, 'hex'), 'base64')
    expect(result).toBe(base64Output)
  })

  it('should convert from base64 to hex', () => {
    const base64Input = 'SGVsbG8sIE1RVFQ='
    const hexOutput = '48656c6c6f2c204d515454'

    const result = convertPayload(base64Input, 'base64', 'encode')
    const hexResult = Buffer.isBuffer(result) ? result.toString('hex') : result

    expect(hexResult).toBe(hexOutput)
  })

  it('should handle conversion between binary and other formats', () => {
    const binaryInput = Buffer.from('Hello')

    // Binary to base64
    expect(convertPayload(binaryInput, 'base64')).toBe('SGVsbG8=')

    // Binary to hex
    expect(convertPayload(binaryInput, 'hex')).toBe('4865 6c6c 6f')

    // Base64 to binary
    expect(convertPayload('SGVsbG8=', 'binary', 'encode')).toBe('SGVsbG8=')

    // Hex to binary
    expect(convertPayload('48656c6c6f', 'binary', 'encode')).toBe('48656c6c6f')
  })

  it('should handle errors in JSON encoding', () => {
    const invalidJson = '{"key": invalid}'
    ;(jsonParse as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid JSON')
    })
    ;(basicLog.error as jest.Mock).mockImplementation(() => {})

    expect(() => convertPayload(invalidJson, 'json', 'encode')).toThrow('Process.exit called with code 1')
    expect(mockExit).toHaveBeenCalledWith(1)
    expect(basicLog.error).toHaveBeenCalled()
  })

  it('should handle errors in CBOR encoding', () => {
    const invalidCbor = '{"key": "value"}'
    ;(cbor.encodeOne as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid CBOR')
    })
    ;(basicLog.error as jest.Mock).mockImplementation(() => {})

    expect(() => convertPayload(invalidCbor, 'cbor', 'encode')).toThrow('Process.exit called with code 1')
    expect(mockExit).toHaveBeenCalledWith(1)
    expect(basicLog.error).toHaveBeenCalled()
  })

  it('should use default behavior when format is undefined', () => {
    const input = 'Hello, MQTT!'
    const buffer = Buffer.from(input)

    const decodeResult = convertPayload(buffer)
    expect(decodeResult).toBe(input)

    const encodeResult = convertPayload(input, undefined, 'encode')
    expect(encodeResult).toEqual(buffer)

    expect(jsonParse).not.toHaveBeenCalled()
    expect(jsonStringify).not.toHaveBeenCalled()
  })
})
