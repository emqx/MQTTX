const createRateSampler = () => {
  let oldTotal = 0
  let lastSampleTime = process.hrtime.bigint()

  return (total: number) => {
    const sampleTime = process.hrtime.bigint()
    const elapsedSeconds = Number(sampleTime - lastSampleTime) / 1e9
    const rate = Math.round((total - oldTotal) / elapsedSeconds)
    oldTotal = total
    lastSampleTime = sampleTime
    return rate
  }
}

export default createRateSampler
