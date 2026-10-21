import { expect } from 'chai'
import { trackDrag } from '@/utils/trackDrag'

const moveTo = (x: number, y = 0) => {
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }))
}

const release = () => {
  document.dispatchEvent(new MouseEvent('mouseup'))
}

describe('trackDrag', () => {
  afterEach(() => {
    document.body.classList.remove('select-none')
  })

  it('passes the pointer offset from the drag start', () => {
    const offsets: Array<[number, number]> = []
    trackDrag(new MouseEvent('mousedown', { clientX: 300, clientY: 200 }), (dx, dy) => offsets.push([dx, dy]))

    moveTo(340, 260)
    moveTo(280, 180)

    expect(offsets).to.deep.equal([
      [40, 60],
      [-20, -20],
    ])
    release()
  })

  it('adds select-none for the drag and removes it on mouseup', () => {
    trackDrag(new MouseEvent('mousedown'), () => undefined)
    expect(document.body.classList.contains('select-none')).to.be.true

    release()
    expect(document.body.classList.contains('select-none')).to.be.false
  })

  it('calls onEnd once on mouseup and ignores moves afterwards', () => {
    const moves: number[] = []
    let ends = 0
    trackDrag(
      new MouseEvent('mousedown', { clientX: 300 }),
      (dx) => moves.push(dx),
      () => (ends += 1),
    )

    moveTo(310)
    release()
    moveTo(320)
    release()

    expect(moves).to.deep.equal([10])
    expect(ends).to.equal(1)
  })

  it('stops early through the returned function without calling onEnd', () => {
    let moves = 0
    let ends = 0
    const stop = trackDrag(
      new MouseEvent('mousedown'),
      () => (moves += 1),
      () => (ends += 1),
    )

    stop()
    moveTo(100)
    release()

    expect(moves).to.equal(0)
    expect(ends).to.equal(0)
    expect(document.body.classList.contains('select-none')).to.be.false
  })
})
