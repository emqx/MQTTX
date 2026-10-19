import { expect } from 'chai'
import delay from '@/utils/delay'

describe('delay', () => {
  it('should delay execution for the specified time', async () => {
    const startTime = Date.now()
    const delayTime = 100 // 100 milliseconds

    await delay(delayTime)

    const endTime = Date.now()
    const elapsedTime = endTime - startTime

    // Allow for some small variance in timing; timers can fire ~1ms early against Date.now()
    expect(elapsedTime).to.be.at.least(delayTime - 2)
    expect(elapsedTime).to.be.below(delayTime + 50)
  })

  it('should resolve without error', async () => {
    try {
      await delay(50)
      // If we reach this point, the promise resolved successfully
      expect(true).to.be.true
    } catch (error) {
      // If we catch an error, the test should fail
      expect.fail('delay function threw an error')
    }
  })
})
