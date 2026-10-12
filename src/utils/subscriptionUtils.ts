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
