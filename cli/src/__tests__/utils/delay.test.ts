import delay from '../../utils/delay'

describe('delay function', () => {
  it('should delay execution for the specified time', async () => {
    const startTime = Date.now()
    const delayTime = 1000 // 1 second

    await delay(delayTime)

    const endTime = Date.now()
    const elapsedTime = endTime - startTime

    expect(elapsedTime).toBeGreaterThanOrEqual(delayTime)
    expect(elapsedTime).toBeLessThan(delayTime + 50)
  })
})
