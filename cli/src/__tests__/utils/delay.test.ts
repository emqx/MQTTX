import delay from '../../utils/delay'
import { afterEach, expect, describe, it, jest } from '@jest/globals'

describe('delay function', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('should delay execution for the specified time', async () => {
    jest.useFakeTimers()
    const resolved = jest.fn()
    delay(1000).then(resolved)

    await jest.advanceTimersByTimeAsync(999)
    expect(resolved).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(resolved).toHaveBeenCalledTimes(1)
  })
})
