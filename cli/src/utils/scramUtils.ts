import { MqttClient, IClientOptions } from 'mqtt'
import { ScramAuth, ScramAlgorithm } from './scramAuth'

export const setupScramAuth = (
  username: string,
  password: string,
  authMethod: string,
  options: IClientOptions,
): ScramAuth | undefined => {
  // Only work with MQTT 5.0
  if (options.protocolVersion !== 5) {
    return undefined
  }

  // Check if it's a supported SCRAM method
  if (authMethod !== 'SCRAM-SHA-1' && authMethod !== 'SCRAM-SHA-256' && authMethod !== 'SCRAM-SHA-512') {
    return undefined
  }

  try {
    const scramAuth = new ScramAuth(username, password, authMethod as ScramAlgorithm)
    const clientFirstData = scramAuth.clientFirst()

    if (!options.properties) {
      options.properties = {}
    }
    options.properties.authenticationMethod = authMethod
    options.properties.authenticationData = clientFirstData

    return scramAuth
  } catch (error) {
    return undefined
  }
}

export const setupAuthHandler = (client: MqttClient, scramAuth: ScramAuth, authMethod: string): void => {
  client.handleAuth = (packet, callback) => {
    try {
      const serverAuthData = packet.properties?.authenticationData
      if (!serverAuthData) {
        callback(new Error('No authentication data from server'))
        return
      }

      const clientFinalData = scramAuth.clientFinal(serverAuthData)
      const authResponse = {
        cmd: 'auth' as const,
        reasonCode: 0x18,
        properties: {
          authenticationMethod: authMethod,
          authenticationData: clientFinalData,
        },
      }

      callback(undefined, authResponse)
    } catch (error) {
      callback(error instanceof Error ? error : new Error('SCRAM authentication failed'))
    }
  }
}
