import { expect } from 'chai'
import { parseSchema, checkAvroInput, serializeAvroToBuffer, deserializeBufferToAvro } from '@/utils/avro'

import * as avro from 'avsc'

describe('Avro Utils', () => {
  const mockSchema = `
    {
      "type": "record",
      "name": "Person",
      "fields": [
        {"name": "id", "type": "int"},
        {"name": "name", "type": "string"}
      ]
    }
  `

  describe('parseSchema', () => {
    it('should parse raw schema into avro type', () => {
      const targetSchema = avro.Type.forSchema(JSON.parse(mockSchema))

      const resultSchema = parseSchema(mockSchema)

      expect(avro.Type.isType(resultSchema)).to.be.true
      expect(targetSchema.equals(resultSchema)).to.be.true
    })

    it('should throw an error if raw schema does not follow JSON format', () => {
      const invalidRawSchema = 'hello world!'
      expect(() => parseSchema(invalidRawSchema)).to.throw('Schema not following JSON format: ')
    })

    it('should throw an error if raw schema does not fit avro schema pattern', () => {
      const invalidAvroSchema = `
        {
          "type": "invalid",
          "name": "TestRecord",
          "fields": [
            { "name": "field1", "type": "string" }
          ]
        }
      `

      expect(() => parseSchema(invalidAvroSchema)).to.throw('unknown type: "invalid"')
    })
  })

  describe('checkAvroInput', () => {
    it('should validate correct avro input', () => {
      const correctInput = JSON.stringify({ id: 7, name: 'Last' })
      const output = checkAvroInput(mockSchema, correctInput)

      expect(output).to.be.a('string')
      expect(output).to.include('7')
      expect(output).to.include('Last')
    })

    it('should throw an error for invalid avro input', () => {
      const invalidInput = JSON.stringify({ id: 4, name: 7 })

      expect(() => checkAvroInput(mockSchema, invalidInput)).to.throw('Message Test Error at path')
    })
  })

  describe('serializeAvroToBuffer', () => {
    it('should serialize valid input to buffer', () => {
      const correctInput = JSON.stringify({ id: 7, name: 'Carnival' })
      const resultBuffer = serializeAvroToBuffer(correctInput, mockSchema)

      expect(resultBuffer).to.be.instanceof(Buffer)
    })

    it('should throw error for invalid input', () => {
      const invalidInput = JSON.stringify({ id: 'Last', name: 'Carnival' })
      expect(() => serializeAvroToBuffer(invalidInput, mockSchema)).to.throw('Message serialization error:')
    })
  })

  describe('deserializeBufferToAvro', () => {
    it('should deserialize buffer to avro object', () => {
      const schema = avro.Type.forSchema(JSON.parse(mockSchema))
      const inputBuffer = schema.toBuffer({ id: 3, name: 'Skinandi' })

      const result = deserializeBufferToAvro(inputBuffer, mockSchema)

      expect(result).to.be.a('string')
      expect(result).to.include('3')
      expect(result).to.include('Skinandi')
    })

    it('should throw an error for invalid buffer', () => {
      const randomeBuffer = Buffer.from([0x4f, 0x61, 0x7a, 0x3b, 0x19, 0x8e, 0x27, 0x56, 0x9c, 0x2d, 0x73, 0x81])

      expect(() => deserializeBufferToAvro(randomeBuffer, mockSchema)).to.throw('Message deserialization error:')
    })
  })
})
