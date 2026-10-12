import { expect } from 'chai'
import { defineColors, getRandomColor, topicTextColor, TOPIC_TINT_ALPHA } from '@/utils/colors'

const THEMES: Theme[] = ['light', 'dark', 'night']

// Backdrops the subscription list paints (--color-bg-normal per theme), kept
// here independently of the implementation so the tests assert the real
// surface rather than re-running the source's own constants.
const BACKDROP: Record<string, string> = {
  light: '#ffffff',
  dark: '#262729',
  night: '#292b33',
}

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const luminance = (hex: string): number => {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

// Colour the card actually renders: sub.color at TOPIC_TINT_ALPHA over the backdrop.
const renderedSurface = (subColor: string, theme: Theme): string => {
  const alpha = parseInt(TOPIC_TINT_ALPHA, 16) / 255
  const bg = hexToRgb(BACKDROP[theme])
  const tint = hexToRgb(subColor)
  const mix = bg.map((c, i) => Math.round(c * (1 - alpha) + tint[i] * alpha))
  return '#' + mix.map((c) => c.toString(16).padStart(2, '0')).join('')
}

const contrast = (a: string, b: string): number => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
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

  describe('TOPIC_TINT_ALPHA', () => {
    it('is a two-character hex suffix, so `${color}${TOPIC_TINT_ALPHA}` is valid CSS', () => {
      expect(TOPIC_TINT_ALPHA).to.match(/^[0-9a-fA-F]{2}$/)
    })
  })

  describe('topicTextColor', () => {
    it('keeps the topic text readable on every theme for every predefined color', () => {
      // WCAG AA for normal text is 4.5:1 against the surface behind it.
      defineColors.forEach((color) => {
        THEMES.forEach((theme) => {
          const surface = renderedSurface(color, theme)
          const text = topicTextColor(color, theme)
          expect(contrast(surface, text), `${color} on ${theme}`).to.be.at.least(4.5)
        })
      })
    })

    it('keeps extreme user picks readable, which is the reported bug', () => {
      // Dark indigo on the dark theme was unreadable because the text itself
      // was rendered in sub.color.
      ;['#000000', '#ffffff', '#0F003A', '#F5F5F5'].forEach((color) => {
        THEMES.forEach((theme) => {
          const surface = renderedSurface(color, theme)
          const text = topicTextColor(color, theme)
          expect(contrast(surface, text), `${color} on ${theme}`).to.be.at.least(4.5)
        })
      })
    })

    it('derives from the blended surface, not from sub.color', () => {
      // A pure black pick on the light theme looks dark in isolation, which
      // would suggest light text -- but the card renders ~94% white, so the
      // text has to be dark. This is the case that makes the blend necessary.
      const text = topicTextColor('#000000', 'light' as Theme)
      expect(luminance(text)).to.be.lessThan(0.5)
    })

    it('does the converse on dark themes', () => {
      // Pure white pick, dark backdrop: the blend stays dark, so text stays light.
      const text = topicTextColor('#ffffff', 'dark' as Theme)
      expect(luminance(text)).to.be.greaterThan(0.5)
    })

    it('accepts 3-character shorthand hex', () => {
      const text = topicTextColor('#003', 'dark' as Theme)
      expect(text).to.match(/^#[0-9a-f]{6}$/i)
    })

    it('falls back to the theme text color for empty or non-hex input', () => {
      THEMES.forEach((theme) => {
        expect(topicTextColor('', theme)).to.equal(topicTextColor('not-a-color', theme))
        expect(topicTextColor('not-a-color', theme)).to.match(/^#[0-9a-f]{6}$/i)
      })
    })
  })
})
