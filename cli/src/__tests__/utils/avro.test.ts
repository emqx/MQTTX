import { clearCache, getAvroType, serializeAvroToBuffer, deserializeBufferToAvro } from '../../utils/avro'
import logWrapper from '../../utils/logWrapper'
import { expect, describe, it } from '@jest/globals'
import * as avsc from 'avsc'
import * as path from 'path'

// Mock the logWrapper and process.exit
jest.mock('../../utils/logWrapper', () => ({
  fail: jest.fn(),
}))
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
  throw new Error(`Process exited with code ${code}`)
})

const mockSchemaPath = path.join(__dirname, 'mockData/mockAvroSchema.avsc')
const schema: avsc.Type = avsc.Type.forSchema({
  type: 'record',
  name: 'SensorData',
  fields: [
    { name: 'deviceId', type: 'string' },
    { name: 'sensorType', type: 'string' },
    { name: 'value', type: 'double' },
    { name: 'timestamp', type: 'long' },
  ],
})
expect(avsc.Type.isType(schema)).toBe(true)

const jsonMessage = '{"deviceId":"123456", "sensorType": "Temperature", "value": 22.5, "timestamp": 16700}'
const message = JSON.parse(jsonMessage)

// tests:
describe('avro', () => {
  beforeEach(() => {
    // clear schema cache before each test
    clearCache()
  })

  describe('getAvroType', () => {
    it('should get avro schema from a specific file', () => {
      const resultSchema = getAvroType(mockSchemaPath)

      expect(avsc.Type.isType(resultSchema)).toBe(true)
      expect(schema.equals(resultSchema)).toBe(true)
    })

    it('should throw an error if schema read from file is invalid', () => {
      const invalidSchemaPath = path.join(__dirname, '/mockData/invalidSchema.avsc')

      expect(() => getAvroType(invalidSchemaPath)).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringMatching(/Schema not following JSON format:*/))
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should throw an error if file does not exist', () => {
      const nonExistFilePath = path.join(__dirname, 'file_not_exists')
      expect(() => getAvroType(nonExistFilePath)).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringMatching(/Unable to load avro schema from *:*/))
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('serializeAvroToBuffer', () => {
    it('should serialize Json message with an avro schema correctly', () => {
      const inputMessage = message

      const targetBuffer = schema.toBuffer(inputMessage)

      const resultBuffer = serializeAvroToBuffer(jsonMessage, mockSchemaPath)

      expect(resultBuffer).toBeInstanceOf(Buffer)
      expect(targetBuffer.equals(resultBuffer)).toBe(true)
    })

    it('should throw an error if input message does not follow json format', () => {
      const unstructuredInputMessage = 'Hello, world!'

      expect(() => serializeAvroToBuffer(unstructuredInputMessage, mockSchemaPath)).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringMatching(/Invalid JSON input:*/))
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should throw an error if message does not match schema', async () => {
      const unmatchedMessageObj = JSON.parse(jsonMessage)
      delete unmatchedMessageObj.deviceId
      const unmatchedMessage = JSON.stringify(unmatchedMessageObj)

      expect(() => serializeAvroToBuffer(unmatchedMessage, mockSchemaPath)).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(
        expect.stringMatching(/Unable to serialize message to avro buffer:*/),
      )
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('deserializeBufferToAvro', () => {
    it('should deserialize Buffer to string with an avro schema correctly', () => {
      const inputBuffer = schema.toBuffer(message)
      const targetMessage = JSON.stringify(schema.fromBuffer(inputBuffer))

      // test without format
      const resultMessageWithoutFormat = deserializeBufferToAvro(inputBuffer, mockSchemaPath, false)
      expect(typeof resultMessageWithoutFormat).toBe('string')
      expect(resultMessageWithoutFormat === targetMessage).toBe(true)

      // test with format
      const resultMessageWithFormat = deserializeBufferToAvro(inputBuffer, mockSchemaPath, true)
      expect(resultMessageWithFormat).toBeInstanceOf(Buffer)
      expect(resultMessageWithoutFormat === targetMessage).toBe(true)
    })

    it('should throw an error if Buffer is not valid avro encoded buffer', () => {
      const randomBuffer = Buffer.from([0x4f, 0x61, 0x7a, 0x3b, 0x19, 0x8e, 0x27, 0x56, 0x9c, 0x2d, 0x73, 0x81])

      // test without format
      expect(() => deserializeBufferToAvro(randomBuffer, mockSchemaPath, false)).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringMatching(/Unable to deserialize avro encoded buffer:*/))
      expect(mockExit).toHaveBeenCalledWith(1)

      // test with format
      expect(() => deserializeBufferToAvro(randomBuffer, mockSchemaPath, true)).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringMatching(/Unable to deserialize avro encoded buffer:*/))
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })
})
