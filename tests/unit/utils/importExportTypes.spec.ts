import { expect } from 'chai'
import {
  typeNull,
  typeUndefined,
  emptyString,
  emptyArray,
  emptyObject,
  specialDataTypes,
  stringProps,
  replaceSpecialDataTypes,
  recoverSpecialDataTypes,
  recoverSpecialDataTypesFromString,
} from '@/utils/importExportTypes'

describe('importExportTypes utility functions', () => {
  describe('Constants', () => {
    it('should have correct values for special data types', () => {
      expect(typeNull).to.equal('TYPE_NULL')
      expect(typeUndefined).to.equal('TYPE_UNDEFINED')
      expect(emptyString).to.equal('EMPTY_STRING')
      expect(emptyArray).to.equal('EMPTY_ARRAY')
      expect(emptyObject).to.equal('EMPTY_OBJECT')
    })

    it('should have correct specialDataTypes array', () => {
      expect(specialDataTypes).to.deep.equal([typeNull, typeUndefined, emptyString, emptyArray, emptyObject])
    })

    it('should have correct stringProps array', () => {
      expect(stringProps).to.include.members([
        'clientId',
        'name',
        'mqttVersion',
        'password',
        'topic',
        'username',
        'lastWillPayload',
        'lastWillTopic',
        'contentType',
      ])
    })
  })

  describe('replaceSpecialDataTypes', () => {
    it('should replace special data types in JSON string', () => {
      const input = '{"a": null, "b": undefined, "c": "", "d": [], "e": {}}'
      const expected = `{"a": "${typeNull}", "b": "${typeUndefined}", "c": "${emptyString}", "d": "${emptyArray}", "e": "${emptyObject}"}`
      expect(replaceSpecialDataTypes(input)).to.equal(expected)
    })
  })

  describe('recoverSpecialDataTypes', () => {
    it('should recover special data types from string', () => {
      expect(recoverSpecialDataTypes(typeNull)).to.be.null
      expect(recoverSpecialDataTypes(typeUndefined)).to.be.undefined
      expect(recoverSpecialDataTypes(emptyString)).to.equal('')
      expect(recoverSpecialDataTypes(emptyArray)).to.deep.equal([])
      expect(recoverSpecialDataTypes(emptyObject)).to.deep.equal({})
      expect(recoverSpecialDataTypes('normal')).to.equal('normal')
    })
  })

  describe('recoverSpecialDataTypesFromString', () => {
    it('should recover special data types in JSON string', () => {
      const input = `{"a": "${typeNull}", "b": "${typeUndefined}", "c": "${emptyString}", "d": "${emptyArray}", "e": "${emptyObject}"}`
      const expected = '{"a": null, "b": undefined, "c": "", "d": [], "e": {}}'
      expect(recoverSpecialDataTypesFromString(input)).to.equal(expected)
    })
  })
})
