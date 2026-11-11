import chalk from 'chalk'
import logWrapper, { batchLog } from '../../utils/logWrapper'

describe('batch output', () => {
  const colorLevel = chalk.level

  beforeEach(() => {
    chalk.level = 0
  })

  afterEach(() => {
    chalk.level = colorLevel
    jest.restoreAllMocks()
  })

  it('right-aligns indices to the item count and separates text with two spaces', () => {
    const lines = batchLog.payload(Array.from({ length: 256 }, (_, index) => `item-${index + 1}`)).split('\n')

    expect([lines[0], lines[9], lines[255]]).toEqual(['  [1]  item-1', ' [10]  item-10', '[256]  item-256'])
  })

  it('dims the index without dimming the item text', () => {
    chalk.level = 1

    expect(batchLog.payload(['text'])).toBe('\u001b[2m[1]\u001b[22m  text')
  })

  it('prints an empty item as an index without trailing spaces', () => {
    expect(batchLog.payload([''])).toBe('[1]')
  })

  it('keeps the base64 wrapper for binary items', () => {
    expect(batchLog.payload([{ b64: '/w==' }])).toBe('[1]  {"b64":"/w=="}')
  })

  it.each([
    ['TRUNCATED_ITEM', 'Batch rejected (TRUNCATED_ITEM): demo, 53 B, no items delivered.'],
    [
      'BATCH_LIMIT_EXCEEDED',
      'Batch rejected (BATCH_LIMIT_EXCEEDED): demo, 53 B, no items delivered. Check --batch-max-items and --batch-max-bytes.',
    ],
  ])('reports %s with its context and any limit hint', (code, message) => {
    const fail = jest.spyOn(logWrapper, 'fail').mockImplementation(jest.fn())

    batchLog.rejected(code, 'demo', 53)

    expect(fail).toHaveBeenCalledWith(message)
  })

  it.each([
    { items: 1, batches: 1, message: 'Published 1 item in 1 batch' },
    { items: 4, batches: 1, message: 'Published 4 items in 1 batch' },
    { items: 600, batches: 3, message: 'Published 600 items in 3 batches' },
  ])('reports $items items in $batches batches', ({ items, batches, message }) => {
    const success = jest.spyOn(logWrapper, 'success').mockImplementation(jest.fn())

    batchLog.published(items, batches)

    expect(success).toHaveBeenCalledWith(message)
  })
})
