import logWrapper from './logWrapper'

// Benchmark retry counters are stored in arrays, whose maximum length is 2^32 - 1.
const MAX_CLIENT_COUNT = 0xffffffff

const validateClientCount = (count: unknown): void => {
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > MAX_CLIENT_COUNT) {
    logWrapper.fail(`Invalid client count: ${count}. Expected an integer between 1 and ${MAX_CLIENT_COUNT}.`)
    process.exit(1)
  }
}

export default validateClientCount
