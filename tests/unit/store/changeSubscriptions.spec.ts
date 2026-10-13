import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import app from '@/store/modules/app'

describe('app store CHANGE_SUBSCRIPTIONS', () => {
  const subscriptions = [{ id: 's1', topic: 'a/b', qos: 0 }] as SubscriptionModel[]

  it('should not throw for a connection that has not connected yet', () => {
    const state = Vue.observable({ ...app.state, activeConnection: {} } as App)
    expect(() => app.mutations.CHANGE_SUBSCRIPTIONS(state, { id: 'offline', subscriptions })).to.not.throw()
    expect(state.activeConnection).to.deep.equal({})
  })

  it('should update the subscriptions of an active connection', () => {
    const state = Vue.observable({ ...app.state, activeConnection: {} } as App)
    app.mutations.CHANGE_ACTIVE_CONNECTION(state, { id: 'c1', client: {} })
    app.mutations.CHANGE_SUBSCRIPTIONS(state, { id: 'c1', subscriptions })
    expect(state.activeConnection.c1.subscriptions).to.deep.equal(subscriptions)
  })
})
