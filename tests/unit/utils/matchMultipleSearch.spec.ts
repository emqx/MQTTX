import { expect } from 'chai'
import matchMultipleSearch from '@/utils/matchMultipleSearch'

describe('matchMultipleSearch', () => {
  const testData = [
    { name: 'John Doe', age: '30', city: 'New York' },
    { name: 'Jane Smith', age: '25', city: 'Los Angeles' },
    { name: 'Bob Johnson', age: '35', city: 'Chicago' },
    { name: 'Alice Brown', age: '28', city: 'San Francisco' },
  ]

  it('should match partial name search', async () => {
    const result = await matchMultipleSearch(testData, { name: 'john' })
    expect(result).to.not.be.null
    expect(result!).to.have.lengthOf(2)
    expect(result!.map((item) => item.name)).to.include.members(['John Doe', 'Bob Johnson'])
  })

  it('should match multiple parameter search', async () => {
    const result = await matchMultipleSearch(testData, { name: 'j', age: '30' })
    expect(result).to.not.be.null
    expect(result!).to.have.lengthOf(1)
    expect(result![0].name).to.equal('John Doe')
  })

  it('should be case insensitive', async () => {
    const result = await matchMultipleSearch(testData, { name: 'JOHN' })
    expect(result).to.not.be.null
    expect(result!).to.have.lengthOf(2)
    expect(result!.map((item) => item.name)).to.include.members(['John Doe', 'Bob Johnson'])
  })

  it('should ignore whitespace', async () => {
    const result = await matchMultipleSearch(testData, { name: ' john  doe ' })
    expect(result).to.not.be.null
    expect(result!).to.have.lengthOf(1)
    expect(result![0].name).to.equal('John Doe')
  })

  it('should handle special characters', async () => {
    const specialData = [{ name: 'John@Doe' }, { name: 'Jane@Smith' }]
    const result = await matchMultipleSearch(specialData, { name: 'john@' })
    expect(result).to.not.be.null
    expect(result!).to.have.lengthOf(1)
    expect(result![0].name).to.equal('John@Doe')
  })

  it('should return empty array for no matches', async () => {
    const result = await matchMultipleSearch(testData, { name: 'xyz' })
    expect(result).to.not.be.null
    expect(result!).to.be.an('array').that.is.empty
  })

  it('should handle missing properties', async () => {
    const result = await matchMultipleSearch(testData, { nonexistent: 'value' })
    expect(result).to.not.be.null
    expect(result!).to.be.an('array').that.is.empty
  })

  it('should match partial strings', async () => {
    const result = await matchMultipleSearch(testData, { city: 'new' })
    expect(result).to.not.be.null
    expect(result!).to.have.lengthOf(1)
    expect(result![0].name).to.equal('John Doe')
  })

  it('should handle empty search params', async () => {
    const result = await matchMultipleSearch(testData, {})
    expect(result).to.not.be.null
    expect(result!).to.deep.equal(testData)
  })

  it('should handle empty data array', async () => {
    const result = await matchMultipleSearch([], { name: 'John' })
    expect(result).to.not.be.null
    expect(result!).to.be.an('array').that.is.empty
  })

  it('should reject on error', async () => {
    const invalidData: any = null
    try {
      await matchMultipleSearch(invalidData, { name: 'John' })
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect(error).to.be.an('error')
    }
  })
})
