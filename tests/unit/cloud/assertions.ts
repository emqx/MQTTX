import { assert } from 'chai'

export function expectError(run: () => unknown, expected: Record<string, unknown>): void {
  let failure: unknown
  try {
    run()
  } catch (error) {
    failure = error
  }
  if (!(failure instanceof Error)) assert.fail('Expected an Error to be thrown')
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(Reflect.get(failure, key), value)
}
export async function expectRejection(
  promise: Promise<unknown>,
  expected?: RegExp | Record<string, unknown>,
): Promise<void> {
  let failure: unknown
  try {
    await promise
  } catch (error) {
    failure = error
  }
  if (!(failure instanceof Error)) assert.fail('Expected an Error to be thrown')
  if (expected instanceof RegExp) assert.match(failure.message, expected)
  else if (expected)
    for (const [key, value] of Object.entries(expected)) assert.deepEqual(Reflect.get(failure, key), value)
}
