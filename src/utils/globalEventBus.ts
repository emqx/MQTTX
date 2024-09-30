import { EventEmitter } from 'events'

class GlobalEventBus extends EventEmitter {}

export const globalEventBus = new GlobalEventBus()
