import type { IClientSubscribeOptions } from 'mqtt'

/**
 * Build MQTT 5.0 properties for the SUBSCRIBE packet.
 * Returns undefined when neither subscriptionIdentifier nor userProperties is set.
 */
export const setSubscribeMQTT5Properties = (
  option: Pick<SubscriptionModel, 'subscriptionIdentifier' | 'userProperties'>,
): IClientSubscribeOptions['properties'] => {
  const { subscriptionIdentifier, userProperties } = option
  const properties: NonNullable<IClientSubscribeOptions['properties']> = {}
  if (subscriptionIdentifier) {
    properties.subscriptionIdentifier = subscriptionIdentifier
  }
  if (userProperties && Object.keys(userProperties).length > 0) {
    properties.userProperties = { ...userProperties }
  }
  return Object.keys(properties).length > 0 ? properties : undefined
}

/**
 * Whether subscriptions survive a reconnect: the broker keeps the session after the client
 * disconnects and the client resumes it instead of starting clean. Subscriptions removed
 * while offline would then still be active on the broker after reconnecting.
 */
export const hasPersistentSession = ({
  clean,
  mqttVersion,
  properties,
}: Pick<ConnectionModel, 'clean' | 'mqttVersion' | 'properties'>): boolean => {
  if (clean) {
    return false
  }
  if (mqttVersion !== '5.0') {
    return true
  }
  // MQTT 5.0 ends the session on disconnect unless Session Expiry Interval is set
  const sessionExpiryInterval = properties?.sessionExpiryInterval
  // Same as setMQTT5Properties: an empty interval with Clean Start off is sent as 0xFFFFFFFF
  return sessionExpiryInterval === null || Number(sessionExpiryInterval) > 0
}
