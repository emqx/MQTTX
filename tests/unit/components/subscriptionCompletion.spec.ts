import '../mocks/browserStorage'
import { expect } from 'chai'
import SubscriptionsList from '@/components/SubscriptionsList.vue'

describe('Subscription completion', () => {
  const methods = (SubscriptionsList as any).options.methods
  type SubscribeCallback = (error: Error | null, granted?: { topic: string; qos: number }[]) => Promise<unknown>

  const createContext = () => {
    const callbacks: SubscribeCallback[] = []
    const topics: string[] = []
    const events: unknown[] = []
    const context: any = {
      connectionId: 'connection',
      subRecord: { topic: 'test/topic', qos: 1, disabled: false },
      subsList: [],
      multiTopics: false,
      record: { mqttVersion: '5.0' },
      subLoading: true,
      $log: { info: (message: string) => events.push(message), error: (message: string) => events.push(message) },
      $emit: (...args: unknown[]) => events.push(args),
      getCurrentConnection: () => {},
      saveTopicToSubList: methods.saveTopicToSubList,
      syncSubscriptions: async () => undefined,
      subscribe: methods.subscribe,
      client: {
        subscribe: (topic: string, _options: unknown, callback: SubscribeCallback) => {
          topics.push(topic)
          callbacks.push(callback)
        },
      },
    }
    return { context, callbacks, topics, events }
  }

  it('resolves success after persistence and logging without waiting for a timer', async () => {
    const { context, callbacks, events } = createContext()
    let finishSync!: () => void
    context.syncSubscriptions = (subscriptions: unknown, closeDialog: boolean) => {
      expect(subscriptions).to.equal(context.subsList)
      expect(closeDialog).to.equal(true)
      return new Promise<void>((resolve) => {
        finishSync = resolve
      })
    }
    let resolved = false
    const completion = methods.subscribe.call(context, context.subRecord).then(() => {
      resolved = true
      events.push('resolved')
    })
    await Promise.resolve()
    expect(resolved).to.equal(false)

    const callbackCompletion = callbacks[0](null, [{ topic: 'test/topic', qos: 1 }])
    await Promise.resolve()
    expect(context.subLoading).to.equal(false)
    expect(context.subsList.map((sub: any) => sub.topic)).to.deep.equal(['test/topic'])
    expect(resolved).to.equal(false)

    finishSync()
    await callbackCompletion
    await Promise.resolve()
    expect(resolved).to.equal(true)
    expect(events).to.deep.equal([
      'Saved topic: test/topic',
      'Successfully subscribed to topic: test/topic',
      'resolved',
    ])
    await completion
  })

  it('resolves an error after emitting and logging without waiting for a timer', async () => {
    const { context, callbacks, events } = createContext()
    let resolved = false
    const completion = methods.subscribe.call(context, context.subRecord).then(() => {
      resolved = true
      events.push('resolved')
    })
    await Promise.resolve()
    expect(resolved).to.equal(false)

    await callbacks[0](new Error('subscribe failed'))
    await Promise.resolve()
    expect(resolved).to.equal(true)
    expect(context.subLoading).to.equal(false)
    expect(context.subsList).to.have.length(0)
    expect(events).to.deep.equal([
      ['onSubError', 'Error: subscribe failed', 'Topics: "test/topic"'],
      'Error subscribing to topic: Error: subscribe failed',
      'resolved',
    ])
    await completion
  })

  for (const granted of [undefined, []]) {
    it(`resolves ${granted ? 'empty' : 'missing'} grants without waiting for a timer`, async () => {
      const { context, callbacks, events } = createContext()
      context.syncSubscriptions = () => {
        throw new Error('Empty grants must not be persisted')
      }
      let resolved = false
      const completion = methods.subscribe.call(context, context.subRecord).then(() => {
        resolved = true
        events.push('resolved')
      })
      await Promise.resolve()
      expect(resolved).to.equal(false)

      await callbacks[0](null, granted)
      await Promise.resolve()
      expect(resolved).to.equal(true)
      expect(context.subLoading).to.equal(false)
      expect(context.subsList).to.have.length(0)
      expect(events).to.deep.equal(granted ? ['resolved'] : ['Error subscribing to topic: granted empty', 'resolved'])
      await completion
    })
  }

  it('resubscribes enabled topics in order as each callback finishes without waiting for timers', async () => {
    const { context, callbacks, topics } = createContext()
    context.subsList = [
      { topic: 'first', qos: 0, disabled: false },
      { topic: 'disabled', qos: 0, disabled: true },
      { topic: 'second', qos: 1, disabled: false },
      { topic: 'third', qos: 2, disabled: false },
    ]
    let resolved = false
    const completion = methods.resubscribe.call(context).then(() => {
      resolved = true
    })

    for (const [index, topic] of ['first', 'second', 'third'].entries()) {
      expect(topics).to.deep.equal(['first', 'second', 'third'].slice(0, index + 1))
      expect(resolved).to.equal(false)
      await callbacks[index](null, [{ topic, qos: index }])
      await Promise.resolve()
    }
    expect(topics).to.deep.equal(['first', 'second', 'third'])
    await Promise.resolve()
    expect(resolved).to.equal(true)
    await completion
  })
})
