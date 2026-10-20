import Vue from 'vue'
import type { MqttClient } from 'mqtt'

/**
 * What ConnectionsDetail exposes to the agent. Implemented by ConnectionsDetail itself.
 *
 * The MQTT client lives inside ConnectionsDetail, so the agent drives it through this interface:
 * every operation then goes through the same code path as a manual action, and the UI updates.
 */
export interface ConnectionView {
  readonly connectionId: string
  readonly record: ConnectionModel
  getClient(): Partial<MqttClient>
  isConnecting(): boolean
  connect(): Promise<boolean | void>
  cancelConnect(): void
  disconnect(): void
  subscribe(sub: Partial<SubscriptionModel> & { topic: string; qos: QoS }): Promise<void>
  unsubscribe(topic: string): Promise<boolean>
  publish(message: MessageModel, type: PayloadType): Promise<void>
  /** Publish once and then keep publishing every `seconds` seconds until stopTimedPublish() */
  startTimedPublish(message: MessageModel, type: PayloadType, seconds: number): Promise<void>
  stopTimedPublish(): void
  isTimedPublishing(): boolean
  deleteConnection(): Promise<void>
  /** Reload the record and the connection list from the database */
  reload(): Promise<void>
}

export interface ConnectionBridgeRouter {
  push(location: string): Promise<unknown>
  readonly currentRoute: { path: string; query: Record<string, any>; params: Record<string, any> }
}

export interface ConnectionBridgeOptions {
  router: ConnectionBridgeRouter
  /** Returns whether the connection exists, checked before navigating */
  connectionExists: (id: string) => Promise<boolean>
}

export class ConnectionBridge {
  private views = new Set<ConnectionView>()
  private options: ConnectionBridgeOptions | null = null
  /**
   * Bumped whenever the views or options change. Neither is reactive, so current() reads this to let
   * a computed property that ran before the page registered (the Agent panel's) evaluate again.
   */
  private state = Vue.observable({ version: 0 })

  public configure(options: ConnectionBridgeOptions): void {
    this.options = options
    this.state.version++
  }

  public register(view: ConnectionView): void {
    this.views.add(view)
    this.state.version++
  }

  public unregister(view: ConnectionView): void {
    this.views.delete(view)
    this.state.version++
  }

  /**
   * The view of the connection currently shown, if any.
   *
   * Looked up by the live connection id: vue-router reuses ConnectionsDetail when only the id
   * changes, so a view registered earlier still serves the new connection.
   */
  public current(): ConnectionView | null {
    void this.state.version
    const id = this.options?.router.currentRoute.params.id
    if (!id) return null
    for (const view of this.views) {
      if (view.connectionId === id && view.record.id === id) return view
    }
    return null
  }

  /** Navigate to the connection (like the user clicking it) and wait until its view is ready */
  public async open(connectionId: string, timeoutMs = 8000): Promise<ConnectionView> {
    const route = this.options?.router.currentRoute
    if (route?.query?.oper) {
      throw new Error('The user is editing a connection. Ask them to save or cancel it first.')
    }

    const existing = this.current()
    if (existing && existing.connectionId === connectionId && existing.record.id === connectionId) {
      return existing
    }

    if (this.options && !(await this.options.connectionExists(connectionId))) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    await this.navigate(connectionId)
    return this.waitForView(connectionId, timeoutMs)
  }

  /** Start connecting and resolve when connected; reject with the broker error or on timeout */
  public async connect(view: ConnectionView, timeoutMs = 15000): Promise<void> {
    await view.connect()

    const client = view.getClient()
    if (client.connected) return
    if (!client.once) {
      throw new Error('The MQTT client is not available')
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false
      const finish = (callback: () => void) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        clearInterval(poll)
        client.removeListener?.('connect', onConnect)
        client.removeListener?.('error', onError)
        callback()
      }
      const onConnect = () => finish(resolve)
      const onError = (error: Error) => finish(() => reject(error instanceof Error ? error : new Error(String(error))))
      const timer = setTimeout(() => {
        view.cancelConnect()
        finish(() => reject(new Error(`Connection timed out after ${Math.round(timeoutMs / 1000)}s`)))
      }, timeoutMs)
      // Some failures only surface as close + connectLoading false, without an error event
      const poll = setInterval(() => {
        if (!view.isConnecting() && !client.connected) {
          finish(() => reject(new Error('The connection closed before it was established')))
        }
      }, 100)

      client.once!('connect', onConnect)
      client.once!('error', onError)
    })
  }

  private async navigate(connectionId: string): Promise<void> {
    if (!this.options) {
      throw new Error('The connection bridge is not configured')
    }
    try {
      await this.options.router.push(`/recent_connections/${connectionId}`)
    } catch (error) {
      // vue-router rejects a navigation to the current route; that is not a failure here
      if ((error as { name?: string })?.name !== 'NavigationDuplicated') throw error
    }
  }

  private waitForView(connectionId: string, timeoutMs: number): Promise<ConnectionView> {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now()
      const check = () => {
        const view = this.current()
        if (view && view.connectionId === connectionId && view.record.id === connectionId) {
          resolve(view)
          return
        }
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out opening connection ${connectionId}`))
          return
        }
        setTimeout(check, 50)
      }
      check()
    })
  }
}

export const connectionBridge = new ConnectionBridge()
