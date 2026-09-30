/// <reference types="../../types/global" />

import { IClientOptions, IConnackPacket } from 'mqtt'
import { basicLog } from '../../utils/logWrapper'

const requested: IClientOptions = {
  protocolVersion: 5,
  properties: { requestResponseInformation: true },
}

const connack = (responseInformation?: string): IConnackPacket => ({
  cmd: 'connack',
  sessionPresent: false,
  reasonCode: 0,
  properties: { responseInformation },
})

describe('Response Information', () => {
  let stderr: jest.SpyInstance
  let stdout: jest.SpyInstance

  beforeEach(() => {
    stderr = jest.spyOn(process.stderr, 'write').mockReturnValue(true)
    stdout = jest.spyOn(process.stdout, 'write').mockReturnValue(true)
  })

  afterEach(() => {
    expect(stdout).not.toHaveBeenCalled()
    jest.restoreAllMocks()
  })

  it('writes a requested nonempty MQTT 5 value only to stderr', () => {
    basicLog.responseInformation(requested, connack('responses/client-1'))

    expect(stderr).toHaveBeenCalledTimes(1)
    expect(stderr).toHaveBeenCalledWith('Response Information: "responses/client-1"\n')
  })

  it.each([undefined, ''])('does not print an absent or empty value (%s)', (value) => {
    basicLog.responseInformation(requested, connack(value))
    expect(stderr).not.toHaveBeenCalled()
  })

  it('does not print when the CONNACK has no properties', () => {
    basicLog.responseInformation(requested, { cmd: 'connack', sessionPresent: false, reasonCode: 0 })
    expect(stderr).not.toHaveBeenCalled()
  })

  it.each([3, 4])('does not print for MQTT protocol version %s', (protocolVersion) => {
    basicLog.responseInformation({ ...requested, protocolVersion }, connack('responses/client-1'))
    expect(stderr).not.toHaveBeenCalled()
  })

  it.each([{}, { requestResponseInformation: false }])('does not print without a request (%j)', (properties) => {
    basicLog.responseInformation({ protocolVersion: 5, properties }, connack('responses/client-1'))
    expect(stderr).not.toHaveBeenCalled()
  })

  it('does not print when CONNECT has no properties', () => {
    basicLog.responseInformation({ protocolVersion: 5 }, connack('responses/client-1'))
    expect(stderr).not.toHaveBeenCalled()
  })

  it('escapes newlines, controls, quotes, backslashes and Unicode line separators', () => {
    basicLog.responseInformation(requested, connack('a\r\n\t\b\f\x00\x1b"\\\x7f\x85\u2028\u2029 MQTT 回复'))

    expect(stderr).toHaveBeenCalledWith(
      'Response Information: "a\\r\\n\\t\\b\\f\\u0000\\u001b\\"\\\\\\u007f\\u0085\\u2028\\u2029 MQTT 回复"\n',
    )
  })

  it('prints the current value after reconnect and does not reuse a disappearing value', () => {
    for (const value of ['first', 'second', undefined, '', 'third']) {
      basicLog.responseInformation(requested, connack(value))
    }

    expect(stderr.mock.calls).toEqual([
      ['Response Information: "first"\n'],
      ['Response Information: "second"\n'],
      ['Response Information: "third"\n'],
    ])
  })

  it('keeps interleaved clients and their request flags independent', () => {
    const unrequested: IClientOptions = { protocolVersion: 5 }
    const secondClient = { ...requested, clientId: 'second-client' }
    basicLog.responseInformation(requested, connack('first-client'))
    basicLog.responseInformation(secondClient, connack('second-client'))
    basicLog.responseInformation(unrequested, connack('unrequested-client'))
    basicLog.responseInformation(requested, connack())
    basicLog.responseInformation(secondClient, connack('second-client-new'))

    expect(stderr.mock.calls).toEqual([
      ['Response Information: "first-client"\n'],
      ['Response Information: "second-client"\n'],
      ['Response Information: "second-client-new"\n'],
    ])
  })
})
