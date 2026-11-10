import { validateBatchSelection } from '../../utils/batchPublishing'
import { createBatchSelectionCheck } from '../../utils/batchOptions'

describe('batch capability selection', () => {
  it.each([undefined, 'unknown', ['v1', 'v1'], ['v1', 'unknown']])(
    'rejects missing, mismatched or repeated selection %p',
    (value) => {
      const userProperties = value === undefined ? undefined : { 'batch-publish': value }
      expect(validateBatchSelection({ 'batch-publish': 'v1' }, userProperties)).toBe(false)
    },
  )

  const selected = { properties: { userProperties: { 'batch-publish': 'v1' } } }

  it('requires an exact offer as well as a selection', () => {
    expect(validateBatchSelection(undefined, selected.properties.userProperties)).toBe(false)
    expect(validateBatchSelection({ 'batch-publish': ['v1', 'unknown'] }, selected.properties.userProperties)).toBe(
      false,
    )
  })

  it('rejects a resumed session when v1 was not reselected', () => {
    const check = createBatchSelectionCheck({ 'batch-publish': 'v1' }, true)
    expect(check(selected)).toBe(true)
    expect(() => check({ sessionPresent: true })).toThrow(
      'Batch session resume failed: v1 capability was not reselected.',
    )
  })

  it('requires selection on a new session when negotiation is requested', () => {
    const check = createBatchSelectionCheck({ 'batch-publish': 'v1' }, true)
    check(selected)
    expect(() => check({ sessionPresent: false })).toThrow('Batch negotiation failed:')
  })

  it('accepts a resumed session without a previous capability selection', () => {
    const unpinned = createBatchSelectionCheck()
    expect(unpinned({ sessionPresent: true })).toBe(false)
  })
})
