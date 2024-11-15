/// <reference types="../../types/global" />

import { handleSaveOptions, handleLoadOptions } from '../../utils/options'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { expect, afterAll, describe, it } from '@jest/globals'

const testFilePath = join(__dirname, 'test-options.json')
const defaultPath = join(process.cwd(), 'mqttx-cli-options.json')

describe('options', () => {
  afterAll(() => {
    if (existsSync(testFilePath)) {
      unlinkSync(testFilePath)
    }
    if (existsSync(defaultPath)) {
      unlinkSync(defaultPath)
    }
  })

  it('should save and load options for command type "conn" with default path', () => {
    const options: ConnectOptions = {
      mqttVersion: 5,
      hostname: 'localhost',
      clientId: 'testClient',
      clean: true,
      keepalive: 60,
      reconnectPeriod: 1000,
      maximumReconnectTimes: 10,
      saveOptions: true,
    }

    handleSaveOptions('conn', options)
    const loadedOptions = handleLoadOptions('conn', true, {} as ConnectOptions)
    expect(loadedOptions).toMatchObject(options as unknown as Record<string, unknown>)
  })

  it('should save and load options for command type "pub" with custom path', () => {
    const options: PublishOptions = {
      mqttVersion: 5,
      hostname: 'localhost',
      clientId: 'testClient',
      clean: true,
      keepalive: 60,
      reconnectPeriod: 1000,
      maximumReconnectTimes: 10,
      topic: 'test/topic',
      message: 'Hello, MQTT!',
      qos: 1,
      saveOptions: testFilePath,
    }

    handleSaveOptions('pub', options)
    const loadedOptions = handleLoadOptions('pub', testFilePath, {} as PublishOptions)
    expect(loadedOptions).toMatchObject(options as unknown as Record<string, unknown>)

    const userOptions: PublishOptions = {
      mqttVersion: 5,
      hostname: 'localhost',
      clientId: 'testClient',
      clean: true,
      keepalive: 60,
      reconnectPeriod: 1000,
      maximumReconnectTimes: 10,
      topic: 'user/topic',
      message: 'User message',
      qos: 1,
      saveOptions: testFilePath,
    }

    const overriddenOptions = handleLoadOptions('pub', testFilePath, userOptions)
    expect(overriddenOptions.topic).toEqual('user/topic')
    expect(overriddenOptions.message).toEqual('User message')
  })

  it('should save and load options for command type "sub" with default path', () => {
    const options: SubscribeOptions = {
      mqttVersion: 5,
      hostname: 'localhost',
      clientId: 'testClient',
      clean: true,
      keepalive: 60,
      reconnectPeriod: 1000,
      maximumReconnectTimes: 10,
      topic: ['test/topic'],
      qos: [1],
      saveOptions: true,
      verbose: true,
    }

    handleSaveOptions('sub', options)
    const loadedOptions = handleLoadOptions('sub', true, {} as SubscribeOptions)
    expect(loadedOptions).toMatchObject(options as unknown as Record<string, unknown>)
  })

  it('should save and load options for command type "benchConn" with custom path', () => {
    const options: BenchConnectOptions = {
      mqttVersion: 5,
      hostname: 'localhost',
      clientId: 'testClient',
      clean: true,
      keepalive: 60,
      reconnectPeriod: 1000,
      maximumReconnectTimes: 10,
      count: 100,
      interval: 1000,
      saveOptions: testFilePath,
    }

    handleSaveOptions('benchConn', options)
    const loadedOptions = handleLoadOptions('benchConn', testFilePath, {} as BenchConnectOptions)
    expect(loadedOptions).toMatchObject(options as unknown as Record<string, unknown>)
  })

  it('should save and load options for command type "benchPub" with default path', () => {
    const options: BenchPublishOptions = {
      mqttVersion: 5,
      hostname: 'localhost',
      clientId: 'testClient',
      clean: true,
      keepalive: 60,
      reconnectPeriod: 1000,
      maximumReconnectTimes: 10,
      topic: 'test/topic',
      message: 'Hello, MQTT!',
      qos: 1,
      count: 100,
      interval: 1000,
      messageInterval: 500,
      limit: 1000,
      verbose: true,
      saveOptions: true,
    }

    handleSaveOptions('benchPub', options)
    const loadedOptions = handleLoadOptions('benchPub', true, {} as BenchPublishOptions)
    expect(loadedOptions).toMatchObject(options as unknown as Record<string, unknown>)
  })

  it('should save and load options for command type "benchSub" with custom path', () => {
    const options: BenchSubscribeOptions = {
      mqttVersion: 5,
      hostname: 'localhost',
      clientId: 'testClient',
      clean: true,
      keepalive: 60,
      reconnectPeriod: 1000,
      maximumReconnectTimes: 10,
      topic: ['test/topic'],
      qos: [1],
      count: 100,
      interval: 1000,
      saveOptions: testFilePath,
      verbose: true,
    }

    handleSaveOptions('benchSub', options)
    const loadedOptions = handleLoadOptions('benchSub', testFilePath, {} as BenchSubscribeOptions)
    expect(loadedOptions).toMatchObject(options as unknown as Record<string, unknown>)
  })

  it('should save and load options for command type "simulate" with default path', () => {
    const options: SimulatePubOptions = {
      mqttVersion: 5,
      hostname: 'localhost',
      clientId: 'testClient',
      clean: true,
      keepalive: 60,
      reconnectPeriod: 1000,
      maximumReconnectTimes: 10,
      topic: 'test/topic',
      message: 'Hello, MQTT!',
      qos: 1,
      count: 100,
      interval: 1000,
      messageInterval: 500,
      limit: 1000,
      verbose: true,
      scenario: 'testScenario',
      file: 'testFile',
      saveOptions: true,
    }

    handleSaveOptions('simulate', options)
    const loadedOptions = handleLoadOptions('simulate', true, {} as SimulatePubOptions)
    expect(loadedOptions).toMatchObject(options as unknown as Record<string, unknown>)
  })
})
