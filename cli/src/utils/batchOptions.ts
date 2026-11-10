import { validateBatchSelection } from './batchPublishing'

/** Add the v1 capability offer after option validation. */
export const addBatchOffer = (options: Pick<PublishOptions, 'batchNegotiate' | 'connUserProperties'>) => {
  if (options.batchNegotiate) {
    options.connUserProperties = { ...options.connUserProperties, 'batch-publish': 'v1' }
  }
}

/** Keep the selected capability pinned only for this client and process. */
export const createBatchSelectionCheck = (offer?: Record<string, string | string[]>, required = false) => {
  let pinned = false
  return (packet: {
    sessionPresent?: boolean
    properties?: { userProperties?: Record<string, string | string[]> }
  }) => {
    const selected = validateBatchSelection(offer, packet.properties?.userProperties)
    if (pinned && packet.sessionPresent && !selected) {
      throw new Error('Batch session resume failed: v1 capability was not reselected.')
    }
    if (required && !selected) {
      throw new Error('Batch negotiation failed: expected exactly one batch-publish=v1 selection.')
    }
    if (selected) pinned = true
    return selected
  }
}
