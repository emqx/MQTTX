import _ from 'lodash'

/**
 * MQTT 5 properties helpers, kept in a module of their own (no `@/store`
 * dependency) so unit tests can import them without bundling the store
 * and its database layer.
 */
export const setMQTT5Properties = ({ clean, properties: option }: ConnectionModel) => {
  if (option === undefined) {
    return undefined
  }
  const properties: ClientPropertiesModel = _.cloneDeep(option)
  if (properties.sessionExpiryInterval === null && !clean) {
    /**
      Clean Start set True and Session Expiry Interval set 0, the server MUST delete any Session State it holds for the Client
      Clean Start set False and Session Expiry Interval set 0xFFFFFFFF, the server MUST NOT delete any Session State it holds for the Client
      Non-standard usage, user-friendly only, remember that Clean Start needs to be used with sessionExpiryInterval In MQTT 5.0
    **/
    properties.sessionExpiryInterval = parseInt('0xFFFFFFFF', 16)
  }
  // Cleared el-input fields with v-model.number produce '' instead of undefined (#2059);
  // mqtt-packet fails int32 validation on empty strings, so drop them along with null/undefined.
  return Object.fromEntries(Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined && v !== ''))
}

export const setWillMQTT5Properties = (option: WillPropertiesModel) => {
  if (option === undefined) {
    return undefined
  }
  const properties: WillPropertiesModel = _.cloneDeep(option)
  return Object.fromEntries(Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined && v !== ''))
}
