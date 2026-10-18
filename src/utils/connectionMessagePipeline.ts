import type { MqttClient } from 'mqtt'

/** The live MQTT client is only used as an identity key for its pipeline */
type PipelineClient = Partial<MqttClient>

/**
 * Keeps one message pipeline per MQTT client.
 *
 * The client outlives the connection page, so the pipeline is not removed when the page is left:
 * incoming messages keep being processed and saved while the user is on another page. When a page
 * binds again it replaces the previous pipeline, so exactly one handler stays attached and it always
 * belongs to the page that is currently mounted (a dialog reloading the app never doubles messages).
 */
const teardowns = new WeakMap<PipelineClient, () => void>()

/** Binds a pipeline to `client`, tearing down the one left by a previous page instance first */
export const bindMessagePipeline = (client: PipelineClient, teardown: () => void): void => {
  const previous = teardowns.get(client)
  if (previous) previous()
  teardowns.set(client, teardown)
}

/** Removes the pipeline bound to `client`, if any (used when the connection is stopped or deleted) */
export const tearDownMessagePipeline = (client: PipelineClient): void => {
  const teardown = teardowns.get(client)
  if (!teardown) return
  teardowns.delete(client)
  teardown()
}
