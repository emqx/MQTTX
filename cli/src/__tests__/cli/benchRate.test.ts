/// <reference types="../../types/global" />

import { connect } from 'mqtt'
import { benchSub } from '../../lib/sub'
import { benchPub } from '../../lib/pub'

jest.mock('mqtt', () => ({
  connect: jest.fn(() => {
    const { EventEmitter } = jest.requireActual('events')
    return Object.assign(new EventEmitter(), {
      connected: true,
      subscribe: (
        topic: string,
        _options: unknown,
        callback: (error: null, grants: { topic: string; qos: number }[]) => void,
      ) => callback(null, [{ topic, qos: 0 }]),
      publish: (_topic: string, _payload: string, _options: unknown, callback: (error: null) => void) => callback(null),
    })
  }),
}))

jest.mock('../../utils/delay', () => ({
  __esModule: true,
  default: () => Promise.resolve(),
}))

describe.each(['sub', 'pub'] as const)('bench %s rate', (command) => {
  let stdout: jest.SpyInstance
  let stderr: jest.SpyInstance
  let interval: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: 0 })
    stdout = jest.spyOn(process.stdout, 'write').mockReturnValue(true)
    stderr = jest.spyOn(process.stderr, 'write').mockReturnValue(true)
    interval = jest.spyOn(global, 'setInterval')
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  const start = async (verbose = true, count = 1) => {
    const options: BenchConnectOptions = {
      hostname: '127.0.0.1',
      port: 1883,
      mqttVersion: 4,
      clientId: 'rate-test',
      clean: true,
      keepalive: 60,
      reconnectPeriod: 0,
      maximumReconnectTimes: 0,
      count,
      interval: 0,
    }
    if (command === 'sub') {
      await benchSub({ ...options, topic: ['rate-test'], qos: [0], verbose })
    } else {
      await benchPub({
        ...options,
        topic: 'rate-test',
        qos: 0,
        message: 'test',
        messageInterval: 10,
        limit: 0,
        verbose,
      })
    }

    const clients = jest.mocked(connect).mock.results.map(({ value }) => value)
    jest.advanceTimersByTime(5000)
    for (const client of clients) {
      await client.listeners('connect')[0]()
    }

    const sample = interval.mock.calls.find(([, milliseconds]) => milliseconds === 1000)?.[0]
    expect(typeof sample).toBe('function')
    // Drive publishing and sampling explicitly while advancing the monotonic clock.
    for (const { value } of interval.mock.results) clearInterval(value)
    const publishers = interval.mock.calls.filter(([, milliseconds]) => milliseconds === 10)

    return {
      receive: (messages: number) => {
        for (let i = 0; i < messages; i++) {
          if (command === 'sub') clients[i % clients.length].emit('message')
          else publishers[i % publishers.length][0]()
        }
      },
      sample: (elapsedMs: number) => {
        jest.advanceTimersByTime(elapsedMs)
        sample()
      },
    }
  }

  const expectReport = (total: number, rate: number) => {
    const output = [...stdout.mock.calls, ...stderr.mock.calls].map(([text]) => String(text)).join('')
    const expected =
      command === 'sub'
        ? `Received total: ${total}, rate: ${rate}/s`
        : `Published total: ${total}, message rate: ${rate}/s`
    expect(output).toContain(expected)
    stdout.mockClear()
    stderr.mockClear()
  }

  it.each([false, true])('normalizes a delayed sample across clients with verbose=%s', async (verbose) => {
    const bench = await start(verbose, 2)
    bench.receive(1000)
    bench.sample(10000)
    expectReport(1000, 100)
  })

  it.each([false, true])('uses each sampling window and reports idle periods with verbose=%s', async (verbose) => {
    const bench = await start(verbose)
    bench.receive(1000)
    bench.sample(2500)
    expectReport(1000, 400)

    bench.receive(900)
    bench.sample(1500)
    expectReport(1900, 600)

    bench.sample(2000)
    expectReport(1900, 0)
  })

  it('excludes connection setup and wall-clock changes from elapsed time', async () => {
    const bench = await start()
    bench.receive(1000)
    jest.setSystemTime(-10000)
    bench.sample(1000)
    expectReport(1000, 1000)
  })
})
