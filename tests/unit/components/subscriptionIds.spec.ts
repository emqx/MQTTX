import '../mocks/browserStorage'
import { expect } from 'chai'
import SubscriptionsList from '@/components/SubscriptionsList.vue'

/**
 * The agent subscribes through the same component as the user, in "auto" mode. That path shares one
 * `subRecord`, so it must assign a fresh id per topic; otherwise every subscription is stored under
 * the same primary key and the last one overwrites the previous ones.
 */
describe('Automatic subscriptions', () => {
  const methods = (SubscriptionsList as any).options.methods

  const createContext = () => {
    const context: any = {
      subRecord: { id: 'shared-record', topic: '', qos: 0, disabled: false, color: '#00B572' },
      subsList: [],
      multiTopics: false,
      record: { mqttVersion: '5.0' },
      subLoading: false,
      $log: { info: () => {}, error: () => {} },
      $emit: () => {},
      saveTopicToSubList: methods.saveTopicToSubList,
      syncSubscriptions: async () => undefined,
      client: {
        subscribe: (topics: string | string[], _options: unknown, callback: (error: null, granted: any[]) => void) => {
          const list = Array.isArray(topics) ? topics : [topics]
          callback(
            null,
            list.map((topic) => ({ topic, qos: 1 })),
          )
        },
      },
    }
    return context
  }

  it('gives every automatically subscribed topic its own id', async () => {
    const context = createContext()

    for (const topic of ['e2e/c02/a', 'e2e/c02/b', 'e2e/c02/c']) {
      await methods.subscribe.call(context, { topic, qos: 0, disabled: false }, true)
    }

    expect(context.subsList.map((sub: any) => sub.topic)).to.deep.equal(['e2e/c02/a', 'e2e/c02/b', 'e2e/c02/c'])
    expect(new Set(context.subsList.map((sub: any) => sub.id)).size).to.equal(3)
  })

  it('keeps an id the caller passes, used by the system topic shortcut', async () => {
    const context = createContext()

    await methods.subscribe.call(context, { topic: '$SYS/#', id: 'system-topic', qos: 0, disabled: false }, true)

    expect(context.subsList[0].id).to.equal('system-topic')
  })

  it('updates the existing record instead of adding a duplicate for the same topic', async () => {
    const context = createContext()

    await methods.subscribe.call(context, { topic: 'e2e/c02/a', qos: 0, disabled: false }, true)
    const firstId = context.subsList[0].id
    await methods.subscribe.call(context, { topic: 'e2e/c02/a', qos: 1, disabled: false }, true)

    expect(context.subsList).to.have.length(1)
    expect(context.subsList[0].id).to.equal(firstId)
    expect(context.subsList[0].qos).to.equal(1)
  })
})
