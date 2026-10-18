import { expect } from 'chai'
import {
  clampFloatRect,
  defaultFloatRect,
  moveFloatRect,
  resizeFloatRect,
  FLOAT_MIN_WIDTH,
  FLOAT_MIN_HEIGHT,
} from '@/utils/ai/agent/floatRect'

const large = { width: 1440, height: 900 }
const small = { width: 500, height: 600 }

describe('floatRect', () => {
  describe('defaultFloatRect', () => {
    it('should sit at the bottom right of a large window', () => {
      expect(defaultFloatRect(large)).to.deep.equal({ x: 864, y: 164, width: 560, height: 720 })
    })

    it('should shrink to the available width and height of a small window', () => {
      expect(defaultFloatRect(small)).to.deep.equal({ x: 76, y: 16, width: 408, height: 568 })
    })
  })

  describe('clampFloatRect', () => {
    it('should pull a window that starts outside the view back into the available area', () => {
      expect(clampFloatRect({ x: -100, y: -50, width: 500, height: 600 }, large)).to.deep.equal({
        x: 84,
        y: 8,
        width: 500,
        height: 600,
      })
    })

    it('should cap a window that is larger than the available area', () => {
      expect(clampFloatRect({ x: 1000, y: 800, width: 2000, height: 2000 }, large)).to.deep.equal({
        x: 84,
        y: 8,
        width: 1348,
        height: 884,
      })
    })

    it('should use the available area when the view is smaller than the minimum size', () => {
      expect(clampFloatRect({ x: 0, y: 0, width: 500, height: 500 }, { width: 300, height: 300 })).to.deep.equal({
        x: 84,
        y: 8,
        width: 208,
        height: 284,
      })
    })

    it('should never return a negative size', () => {
      const rect = clampFloatRect({ x: 0, y: 0, width: 500, height: 500 }, { width: 90, height: 16 })
      expect(rect.width).to.be.at.least(0)
      expect(rect.height).to.be.at.least(0)
    })
  })

  describe('moveFloatRect', () => {
    it('should clamp a window dragged past the right and bottom edges', () => {
      expect(moveFloatRect({ x: 864, y: 164, width: 560, height: 720 }, 1000, 1000, large)).to.deep.equal({
        x: 872,
        y: 172,
        width: 560,
        height: 720,
      })
    })

    it('should clamp a window dragged past the left bar and top edge', () => {
      expect(moveFloatRect({ x: 864, y: 164, width: 560, height: 720 }, -5000, -5000, large)).to.deep.equal({
        x: 84,
        y: 8,
        width: 560,
        height: 720,
      })
    })
  })

  describe('resizeFloatRect', () => {
    const start = { x: 200, y: 100, width: 500, height: 500 }

    it('should grow from the south east corner', () => {
      expect(resizeFloatRect(start, 'se', 100, 50, large)).to.deep.equal({
        x: 200,
        y: 100,
        width: 600,
        height: 550,
      })
    })

    it('should grow from the north west corner', () => {
      expect(resizeFloatRect(start, 'nw', -100, -50, large)).to.deep.equal({
        x: 100,
        y: 50,
        width: 600,
        height: 550,
      })
    })

    it('should move the left edge when dragging the west edge', () => {
      expect(resizeFloatRect(start, 'w', 100, 0, large)).to.deep.equal({
        x: 300,
        y: 100,
        width: 400,
        height: 500,
      })
    })

    it('should keep the right edge fixed at the minimum width', () => {
      const rect = resizeFloatRect(start, 'w', 1000, 0, large)
      expect(rect.width).to.equal(FLOAT_MIN_WIDTH)
      expect(rect.x + rect.width).to.equal(start.x + start.width)
    })

    it('should keep the bottom edge fixed at the minimum height', () => {
      const rect = resizeFloatRect(start, 'n', 0, 1000, large)
      expect(rect.height).to.equal(FLOAT_MIN_HEIGHT)
      expect(rect.y + rect.height).to.equal(start.y + start.height)
    })

    it('should stop at the left bar and top edge without pushing the opposite edges', () => {
      const rect = resizeFloatRect(start, 'nw', -5000, -5000, large)
      expect(rect.x).to.equal(84)
      expect(rect.y).to.equal(8)
      expect(rect.x + rect.width).to.equal(start.x + start.width)
      expect(rect.y + rect.height).to.equal(start.y + start.height)
    })
  })
})
