import { expect } from 'chai'
import {
  checkProtobufInput,
  serializeProtobufToBuffer,
  deserializeBufferToProtobuf,
  printObjectAsString,
} from '@/utils/protobuf'

describe('Protobuf Utils', () => {
  const sampleProto = `
    syntax = "proto3";
    message Person {
      string name = 1;
      int32 age = 2;
    }
  `

  // Protobuf Editions 2023 syntax
  const editionsProto = `
    edition = "2023";
    message Response {
      string body = 1;
      int32 code = 2;
    }
  `

  describe('checkProtobufInput', () => {
    it('should validate correct protobuf input', () => {
      const input = JSON.stringify({ name: 'Alice', age: 30 })
      const result = checkProtobufInput(sampleProto, input, 'Person')
      expect(result).to.be.a('string')
      expect(result).to.include('Alice')
      expect(result).to.include('30')
    })

    it('should throw error for invalid protobuf input', () => {
      const input = JSON.stringify({ name: 'Bob', age: 'invalid' })
      expect(() => checkProtobufInput(sampleProto, input, 'Person')).to.throw('Message Test Failed')
    })
  })

  describe('serializeProtobufToBuffer', () => {
    it('should serialize valid input to buffer', () => {
      const input = JSON.stringify({ name: 'Charlie', age: 25 })
      const result = serializeProtobufToBuffer(input, sampleProto, 'Person')
      expect(result).to.be.instanceof(Buffer)
    })

    it('should throw error for invalid input', () => {
      const input = JSON.stringify({ name: 'David', age: 'invalid' })
      expect(() => serializeProtobufToBuffer(input, sampleProto, 'Person')).to.throw('Message serialization error')
    })
  })

  describe('deserializeBufferToProtobuf', () => {
    it('should deserialize buffer to protobuf object', () => {
      const input = JSON.stringify({ name: 'Eve', age: 28 })
      const buffer = serializeProtobufToBuffer(input, sampleProto, 'Person')
      if (buffer) {
        const result = deserializeBufferToProtobuf(buffer, sampleProto, 'Person')
        expect(result).to.be.a('string')
        expect(result).to.include('Eve')
        expect(result).to.include('28')
      } else {
        expect.fail('Buffer should not be undefined')
      }
    })

    it('should throw error for invalid buffer', () => {
      const invalidBuffer = Buffer.from('invalid data')
      expect(() => deserializeBufferToProtobuf(invalidBuffer, sampleProto, 'Person')).to.throw(
        'Message deserialization error',
      )
    })
  })

  describe('printObjectAsString', () => {
    it('should print object as formatted string', () => {
      const obj = { name: 'Frank', age: 35, address: { city: 'New York', zip: '10001' } }
      const result = printObjectAsString(obj)
      expect(result).to.be.a('string')
      expect(result).to.include('name: "Frank"')
      expect(result).to.include('age: 35')
      expect(result).to.include('city: "New York"')
      expect(result).to.include('zip: "10001"')
    })
  })

  describe('Protobuf Editions 2023', () => {
    it('should validate correct editions 2023 protobuf input', () => {
      const input = JSON.stringify({ body: 'test message', code: 200 })
      const result = checkProtobufInput(editionsProto, input, 'Response')
      expect(result).to.be.a('string')
      expect(result).to.include('test message')
      expect(result).to.include('200')
    })

    it('should serialize editions 2023 input to buffer', () => {
      const input = JSON.stringify({ body: 'hello', code: 100 })
      const result = serializeProtobufToBuffer(input, editionsProto, 'Response')
      expect(result).to.be.instanceof(Buffer)
    })

    it('should deserialize buffer to editions 2023 protobuf object', () => {
      const input = JSON.stringify({ body: 'world', code: 300 })
      const buffer = serializeProtobufToBuffer(input, editionsProto, 'Response')
      if (buffer) {
        const result = deserializeBufferToProtobuf(buffer, editionsProto, 'Response')
        expect(result).to.be.a('string')
        expect(result).to.include('world')
        expect(result).to.include('300')
      } else {
        expect.fail('Buffer should not be undefined')
      }
    })
  })
})
