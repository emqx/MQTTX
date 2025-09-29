import * as mqtt from 'mqtt'
import { IClientOptions } from 'mqtt'
import { setupScramAuth, setupAuthHandler } from './scramUtils'

/**
 * Create MQTT client with enhanced authentication support
 * @param connOpts - MQTT connection options including authentication method
 * @returns MQTT client instance with SCRAM auth configured if applicable
 */
export const createMqttClient = (connOpts: IClientOptions): mqtt.MqttClient => {
  // Initialize SCRAM authentication for MQTT 5.0 enhanced auth
  let scramAuth = undefined
  const authMethod = connOpts.properties?.authenticationMethod
  if (connOpts.protocolVersion === 5 && authMethod && connOpts.username && connOpts.password) {
    scramAuth = setupScramAuth(connOpts.username, connOpts.password, authMethod, connOpts)
  }

  const client = mqtt.connect(connOpts)

  // Register authentication handler for SCRAM handshake
  if (scramAuth && authMethod) {
    setupAuthHandler(client, scramAuth, authMethod)
  }

  return client
}
