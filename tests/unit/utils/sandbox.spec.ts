import { expect } from 'chai'
import sandbox from '@/utils/sandbox'

describe('payload script sandbox', () => {
  it('should preserve plaintext, JSON inputs, message direction and the timed publish index', () => {
    expect(sandbox.executeScript('execute(value => value.toUpperCase())', 'Plaintext', 'hello', 'received')).to.equal(
      'HELLO',
    )
    const script = 'execute((value, direction, index) => JSON.stringify({ value, direction, index }))'
    expect(JSON.parse(sandbox.executeScript(script, 'JSON', '{"value":1}', 'publish', 2))).to.deep.equal({
      value: { value: 1 },
      direction: 'publish',
      index: 2,
    })
  })

  it('should keep Node APIs unavailable to transformation code', () => {
    const script = 'execute(() => [typeof process, typeof require].join(","))'
    expect(sandbox.executeScript(script, 'Plaintext', '', 'publish')).to.equal('undefined,undefined')
  })

  it('should reject asynchronous scripts instead of scheduling work outside the execution timeout', () => {
    expect(() =>
      sandbox.executeScript('async function work() { return 1 }\nwork(); "queued"', 'Plaintext', '', 'publish'),
    ).to.throw()
    expect(() =>
      sandbox.executeScript('Promise.resolve().then(() => 1); "queued"', 'Plaintext', '', 'publish'),
    ).to.throw()
  })

  it('should not return sandbox objects or functions to the renderer', () => {
    for (const script of ['({ toString() { return "value" } })', '(() => "value")']) {
      expect(() => sandbox.executeScript(script, 'Plaintext', '', 'publish')).to.throw()
    }
  })

  it('should turn a script-thrown object into a host Error without exporting the object', () => {
    let error: unknown
    try {
      sandbox.executeScript('throw { toString() { return "script failure" } }', 'Plaintext', '', 'publish')
    } catch (caught) {
      error = caught
    }
    expect(error).to.be.instanceOf(Error)
    expect((error as Error).message).to.contain('script failure')
  })
})
