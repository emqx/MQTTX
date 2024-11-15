/// <reference types="../../types/global" />

import { handleSaveOptions, handleLoadOptions } from '../../utils/options'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { expect, afterAll, describe, it, jest, beforeAll } from '@jest/globals'

const testFilePath = join(__dirname, 'test-options.json')
const testYamlFilePath = join(__dirname, 'test-options.yaml')
const defaultPath = join(process.cwd(), 'mqttx-cli-options.json')

describe('options', () => {
  beforeAll(() => {
    global.command = {
      getOptionValueSource: jest.fn().mockReturnValue('cli'),
    } as any
  })

  afterAll(() => {
    if (existsSync(testFilePath)) {
      unlinkSync(testFilePath)
    }
    if (existsSync(testYamlFilePath)) {
      unlinkSync(testYamlFilePath)
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
    const { saveOptions, loadOptions, ...expectedOptions } = options
    expect(loadedOptions).toMatchObject(expectedOptions as unknown as Record<string, unknown>)
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
    const { saveOptions, loadOptions, ...expectedOptions } = options
    expect(loadedOptions).toMatchObject(expectedOptions as unknown as Record<string, unknown>)

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

  it('should save and load options for command type "pub" with custom yaml path', () => {
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
      saveOptions: testYamlFilePath,
    }

    handleSaveOptions('pub', options)
    const loadedOptions = handleLoadOptions('pub', testYamlFilePath, {} as PublishOptions)
    const { saveOptions, loadOptions, ...expectedOptions } = options
    expect(loadedOptions).toMatchObject(expectedOptions as unknown as Record<string, unknown>)

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
      saveOptions: testYamlFilePath,
    }

    const overriddenOptions = handleLoadOptions('pub', testYamlFilePath, userOptions)
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
    const { saveOptions, loadOptions, ...expectedOptions } = options
    expect(loadedOptions).toMatchObject(expectedOptions as unknown as Record<string, unknown>)
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
    const { saveOptions, loadOptions, ...expectedOptions } = options
    expect(loadedOptions).toMatchObject(expectedOptions as unknown as Record<string, unknown>)
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
    const { saveOptions, loadOptions, ...expectedOptions } = options
    expect(loadedOptions).toMatchObject(expectedOptions as unknown as Record<string, unknown>)
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
    const { saveOptions, loadOptions, ...expectedOptions } = options
    expect(loadedOptions).toMatchObject(expectedOptions as unknown as Record<string, unknown>)
  })

  it('should save and load options for command type "benchSub" with custom yaml path', () => {
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
      saveOptions: testYamlFilePath,
      verbose: true,
    }

    handleSaveOptions('benchSub', options)
    const loadedOptions = handleLoadOptions('benchSub', testYamlFilePath, {} as BenchSubscribeOptions)
    const { saveOptions, loadOptions, ...expectedOptions } = options
    expect(loadedOptions).toMatchObject(expectedOptions as unknown as Record<string, unknown>)
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
    const { saveOptions, loadOptions, ...expectedOptions } = options
    expect(loadedOptions).toMatchObject(expectedOptions as unknown as Record<string, unknown>)
  })
})
