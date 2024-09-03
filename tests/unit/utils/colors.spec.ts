import { expect } from 'chai'
import { defineColors, getRandomColor } from '@/utils/colors'

describe('colors utility functions', () => {
  it('defineColors should have 5 predefined colors', () => {
    expect(defineColors).to.be.an('array')
    expect(defineColors).to.have.lengthOf(5)
    defineColors.forEach((color) => {
      expect(color).to.match(/^#[0-9A-F]{6}$/)
    })
  })

  it('getRandomColor should return a valid hex color', () => {
    const randomColor = getRandomColor()
    expect(randomColor).to.match(/^#[0-9A-F]{6}$/)
  })
})
