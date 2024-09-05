import { serializeProtobufToBuffer, deserializeBufferToProtobuf } from '../../utils/protobuf'
import { expect, describe, it, beforeEach } from '@jest/globals'
import logWrapper from '../../utils/logWrapper'
import * as protobuf from 'protobufjs'
import * as path from 'path'
import { jest } from '@jest/globals'

jest.mock('../../utils/logWrapper', () => ({
  fail: jest.fn(),
}))

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
  throw new Error(`Process exited with code ${code}`)
})

const mockProtoPath = path.join(__dirname, 'mockData/mockProto.proto')
const protoSchema = `
  syntax = "proto3";
  message SensorData {
    string deviceId = 1;
    string sensorType = 2;
    double value = 3;
    int64 timestamp = 4;
  }
`

const jsonMessage = '{"deviceId":"123456", "sensorType": "Temperature", "value": 22.5, "timestamp": 16700}'
const message = JSON.parse(jsonMessage)

describe('protobuf', () => {
  describe('serializeProtobufToBuffer', () => {
    it('should serialize JSON message with a protobuf schema correctly', () => {
      const resultBuffer = serializeProtobufToBuffer(jsonMessage, mockProtoPath, 'SensorData')
      expect(resultBuffer).toBeInstanceOf(Buffer)

      const root = protobuf.parse(protoSchema).root
      const SensorData = root.lookupType('SensorData')
      const decodedMessage = SensorData.decode(resultBuffer)
      expect(decodedMessage.toJSON()).toEqual({
        deviceId: '123456',
        sensorType: 'Temperature',
        value: 22.5,
        timestamp: '16700',
      })
    })

    it('should throw an error if input message does not follow JSON format', () => {
      const invalidInput = 'Not a JSON'

      expect(() => serializeProtobufToBuffer(invalidInput, mockProtoPath, 'SensorData')).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringMatching(/Message serialization error:*/))
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should log an error and exit if message does not match schema', () => {
      const invalidMessage = Buffer.from('{"invalidField": "value"}')
      serializeProtobufToBuffer(invalidMessage, mockProtoPath, 'SensorData')
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should handle Buffer input correctly', () => {
      const bufferInput = Buffer.from(jsonMessage)
      const result = serializeProtobufToBuffer(bufferInput, mockProtoPath, 'SensorData')
      expect(result).toBeInstanceOf(Buffer)
      const root = protobuf.parse(protoSchema).root
      const SensorData = root.lookupType('SensorData')
      const decodedMessage = SensorData.decode(result)
      expect(decodedMessage.toJSON()).toEqual({
        deviceId: '123456',
        sensorType: 'Temperature',
        value: 22.5,
        timestamp: '16700',
      })
    })

    it('should throw an error if protobuf schema file is not found', () => {
      const nonExistentPath = 'non/existent/path.proto'
      expect(() => serializeProtobufToBuffer(jsonMessage, nonExistentPath, 'SensorData')).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringMatching(/Message serialization error:*/))
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should handle verification errors from protobuf', () => {
      const invalidMessage = '{"deviceId": 123}' // deviceId should be a string
      expect(() => serializeProtobufToBuffer(invalidMessage, mockProtoPath, 'SensorData')).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringMatching(/Message serialization error:*/))
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('deserializeBufferToProtobuf', () => {
    it('should deserialize Buffer to string with a protobuf schema correctly', () => {
      const root = protobuf.parse(protoSchema).root
      const SensorData = root.lookupType('SensorData')
      const buffer = SensorData.encode(SensorData.create(message)).finish()
      // Test without format
      const resultWithoutFormat = deserializeBufferToProtobuf(
        Buffer.from(buffer),
        mockProtoPath,
        'SensorData',
        undefined,
      )
      expect(typeof resultWithoutFormat).toBe('string')
      expect(JSON.parse(resultWithoutFormat as string)).toEqual({
        deviceId: '123456',
        sensorType: 'Temperature',
        value: 22.5,
        timestamp: '16700',
      })
    })

    it('should deserialize Buffer to string with a protobuf schema correctly with json format', () => {
      const root = protobuf.parse(protoSchema).root
      const SensorData = root.lookupType('SensorData')
      const buffer = SensorData.encode(SensorData.create(message)).finish()
      // Test with format
      const resultWithFormat = deserializeBufferToProtobuf(Buffer.from(buffer), mockProtoPath, 'SensorData', 'json')
      expect(resultWithFormat).toBeInstanceOf(Buffer)
      expect(JSON.parse(resultWithFormat.toString())).toEqual({
        deviceId: '123456',
        sensorType: 'Temperature',
        value: 22.5,
        timestamp: '16700',
      })
    })

    it('should log an error and exit if buffer is not valid protobuf', () => {
      const invalidBuffer = Buffer.from('{"invalidField": "value"}')

      expect(() => deserializeBufferToProtobuf(invalidBuffer, mockProtoPath, 'SensorData', 'json')).toThrow()
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringMatching(/Message deserialization error:*/))
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should handle verification errors from protobuf during deserialization', () => {
      const invalidBuffer = Buffer.from([0x08, 0x96, 0x01]) // An invalid protobuf message
      deserializeBufferToProtobuf(invalidBuffer, mockProtoPath, 'SensorData', undefined)
      expect(logWrapper.fail).toHaveBeenCalledWith(expect.stringMatching(/Message deserialization error:*/))
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should return JSON string when needFormat is undefined', () => {
      const root = protobuf.parse(protoSchema).root
      const SensorData = root.lookupType('SensorData')
      const buffer = SensorData.encode(SensorData.create(message)).finish()

      const result = deserializeBufferToProtobuf(Buffer.from(buffer), mockProtoPath, 'SensorData', undefined)
      expect(typeof result).toBe('string')
      expect(JSON.parse(result as string)).toEqual({
        deviceId: '123456',
        sensorType: 'Temperature',
        value: 22.5,
        timestamp: '16700',
      })
    })

    it('should return Buffer when needFormat is defined', () => {
      const root = protobuf.parse(protoSchema).root
      const SensorData = root.lookupType('SensorData')
      const buffer = SensorData.encode(SensorData.create(message)).finish()

      const result = deserializeBufferToProtobuf(Buffer.from(buffer), mockProtoPath, 'SensorData', 'json')
      expect(result).toBeInstanceOf(Buffer)
      expect(JSON.parse(result.toString())).toEqual({
        deviceId: '123456',
        sensorType: 'Temperature',
        value: 22.5,
        timestamp: '16700',
      })
    })
  })
})
