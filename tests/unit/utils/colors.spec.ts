import { expect } from 'chai'
import { defineColors, getRandomColor, readableColor } from '@/utils/colors'

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const lightness = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return (max + min) / 2
}

const hue = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  let h = 0
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return h / 6
}

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

  describe('readableColor', () => {
    describe('on dark or night theme', () => {
      it('lightens a very dark color to L >= 0.6', () => {
        // The reported failing case: dark indigo on the Night theme
        const out = readableColor('#0F003A', 'dark' as Theme)
        expect(lightness(out)).to.be.at.least(0.6 - 1e-6)
      })

      it('applies the same clamp on night as on dark', () => {
        const out = readableColor('#0F003A', 'night' as Theme)
        expect(lightness(out)).to.be.at.least(0.6 - 1e-6)
      })

      it('preserves hue when lightening', () => {
        const out = readableColor('#0F003A', 'dark' as Theme)
        expect(Math.abs(hue(out) - hue('#0F003A'))).to.be.lessThan(0.01)
      })

      it('returns colors already in the readable band unchanged', () => {
        // Light cyan from the predefined palette — already legible on dark bg
        expect(readableColor('#6ECBEE', 'dark' as Theme)).to.equal('#6ECBEE')
      })
    })

    describe('on light theme', () => {
      it('darkens a near-white color to L <= 0.55', () => {
        const out = readableColor('#F5F5F5', 'light' as Theme)
        expect(lightness(out)).to.be.at.most(0.55 + 1e-6)
      })

      it('returns dark colors unchanged', () => {
        expect(readableColor('#0F003A', 'light' as Theme)).to.equal('#0F003A')
      })
    })

    describe('input handling', () => {
      it('returns empty input unchanged', () => {
        expect(readableColor('', 'dark' as Theme)).to.equal('')
      })

      it('returns non-hex input unchanged', () => {
        expect(readableColor('not-a-color', 'dark' as Theme)).to.equal('not-a-color')
      })

      it('accepts 3-character shorthand hex', () => {
        // #003 expands to #000033 — very dark, should be lightened on dark theme
        const out = readableColor('#003', 'dark' as Theme)
        expect(lightness(out)).to.be.at.least(0.6 - 1e-6)
      })
    })
  })
})
