import { expect } from 'chai'
import { emptyToNull } from '@/utils/handleString'

describe('handleString', () => {
  describe('emptyToNull', () => {
    it('should convert empty strings to null', () => {
      const input = { name: '', age: 30, email: '' }
      const result = emptyToNull(input)
      expect(result).to.deep.equal({ name: null, age: 30, email: null })
    })

    it('should not modify non-empty strings', () => {
      const input = { name: 'John', age: 30, email: 'john@example.com' }
      const result = emptyToNull(input)
      expect(result).to.deep.equal(input)
    })

    it('should handle objects with nested properties', () => {
      const input = { user: { name: '', age: 30 }, settings: { theme: '' } }
      const result = emptyToNull(input)
      expect(result).to.deep.equal({ user: { name: '', age: 30 }, settings: { theme: '' } })
    })

    it('should handle arrays', () => {
      const input = { names: ['', 'John', ''] }
      const result = emptyToNull(input)
      expect(result).to.deep.equal({ names: ['', 'John', ''] })
    })

    it('should not modify null or undefined values', () => {
      const input = { name: null, age: undefined, email: '' }
      const result = emptyToNull(input)
      expect(result).to.deep.equal({ name: null, age: undefined, email: null })
    })

    it('should handle empty object', () => {
      const input = {}
      const result = emptyToNull(input)
      expect(result).to.deep.equal({})
    })

    it('should handle object with only empty strings', () => {
      const input = { a: '', b: '', c: '' }
      const result = emptyToNull(input)
      expect(result).to.deep.equal({ a: null, b: null, c: null })
    })

    it('should not modify non-string properties', () => {
      const input = { name: '', age: 0, isActive: false, score: NaN }
      const result = emptyToNull(input)
      expect(result).to.deep.equal({ name: null, age: 0, isActive: false, score: NaN })
    })

    it('should handle object with Symbol keys', () => {
      const symbolKey = Symbol('test')
      const input = { [symbolKey]: '' }
      const result = emptyToNull(input)
      expect(result[symbolKey]).to.equal('')
    })

    it('should return the same object reference', () => {
      const input = { name: '' }
      const result = emptyToNull(input)
      expect(result).to.equal(input)
    })
  })
})
