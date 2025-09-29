import { expect, describe, jest } from '@jest/globals'
import { createMqttClient } from '../../utils/mqttConnect'

// Mock mqtt.connect
jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    handleAuth: undefined,
  })),
}))

describe('createMqttClient', () => {
  test('should create MQTT client successfully', () => {
    const connOpts = {
      protocolVersion: 5,
      hostname: 'localhost',
      port: 1883,
      username: 'admin',
      password: 'public',
    }

    const client = createMqttClient(connOpts)

    expect(client).toBeDefined()
    expect(typeof client.on).toBe('function')
  })

  test('should create MQTT client with hostname broker.emqx.io', () => {
    const connOpts = {
      protocolVersion: 5,
      hostname: 'broker.emqx.io',
      port: 1883,
      username: 'admin',
      password: 'public',
    }

    const client = createMqttClient(connOpts)

    expect(client).toBeDefined()
  })

  test('should create MQTT client for MQTT 3.1.1', () => {
    const connOpts = {
      protocolVersion: 4,
      hostname: 'localhost',
      port: 1883,
      username: 'admin',
      password: 'public',
    }

    const client = createMqttClient(connOpts)

    expect(client).toBeDefined()
  })

  test('should create MQTT client without credentials', () => {
    const connOpts = {
      protocolVersion: 5,
      hostname: 'localhost',
      port: 1883,
    }

    const client = createMqttClient(connOpts)

    expect(client).toBeDefined()
  })
})
