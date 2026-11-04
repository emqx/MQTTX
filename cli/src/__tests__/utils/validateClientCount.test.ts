import validateClientCount from '../../utils/validateClientCount'
import logWrapper from '../../utils/logWrapper'

jest.mock('../../utils/logWrapper', () => ({
  fail: jest.fn(),
}))

describe('validateClientCount', () => {
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it.each([1, 2, 1000, 0xffffffff])('accepts the valid client count %p', (count) => {
    expect(() => validateClientCount(count)).not.toThrow()
    expect(logWrapper.fail).not.toHaveBeenCalled()
    expect(process.exit).not.toHaveBeenCalled()
  })

  it.each([-1, 0, 1.5, NaN, Infinity, -Infinity, 0x100000000, Number.MAX_SAFE_INTEGER, '1', null, undefined, true])(
    'rejects the invalid client count %p',
    (count) => {
      expect(() => validateClientCount(count)).toThrow('Process exited with code 1')
      expect(logWrapper.fail).toHaveBeenCalledWith(
        `Invalid client count: ${count}. Expected an integer between 1 and 4294967295.`,
      )
      expect(process.exit).toHaveBeenCalledWith(1)
    },
  )
})
