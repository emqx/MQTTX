import { expect } from 'chai'
import { setSubscribeMQTT5Properties } from '@/utils/subscriptionUtils'
import { setSubscribeMQTT5Properties as setWebSubscribeMQTT5Properties } from '../../../web/src/utils/subscriptionUtils'
import Vue from 'vue'
import { generate } from 'mqtt-packet'

describe('subscriptionUtils', () => {
  describe('setSubscribeMQTT5Properties', () => {
    it('should return undefined when no properties are set', () => {
      expect(setSubscribeMQTT5Properties({})).to.equal(undefined)
      expect(setSubscribeMQTT5Properties({ subscriptionIdentifier: undefined, userProperties: undefined })).to.equal(
        undefined,
      )
      expect(setSubscribeMQTT5Properties({ subscriptionIdentifier: null, userProperties: null })).to.equal(undefined)
    })

    it('should treat empty userProperties object as unset', () => {
      expect(setSubscribeMQTT5Properties({ userProperties: {} })).to.equal(undefined)
    })

    it('should build properties with subscriptionIdentifier only', () => {
      expect(setSubscribeMQTT5Properties({ subscriptionIdentifier: 10 })).to.deep.equal({
        subscriptionIdentifier: 10,
      })
    })

    it('should build properties with userProperties only', () => {
      const userProperties = { 'stream-offset': 'earliest' }
      expect(setSubscribeMQTT5Properties({ userProperties })).to.deep.equal({ userProperties })
    })

    it('should build properties with both fields and keep duplicate-key arrays', () => {
      const userProperties = { 'stream-offset': '1721000000000000', tag: ['a', 'b'] }
      expect(setSubscribeMQTT5Properties({ subscriptionIdentifier: 3, userProperties })).to.deep.equal({
        subscriptionIdentifier: 3,
        userProperties,
      })
    })

    for (const [name, buildProperties] of [
      ['desktop', setSubscribeMQTT5Properties],
      ['web', setWebSubscribeMQTT5Properties],
    ] as const) {
      it(`should encode ${name} reactive user properties without Vue metadata`, () => {
        const userProperties = { 'stream-offset': 'earliest', tag: ['', 'second'] }
        const expected = generate(
          {
            cmd: 'subscribe',
            messageId: 1,
            subscriptions: [{ topic: 'test/properties', qos: 1 }],
            properties: { userProperties },
          },
          { protocolVersion: 5 },
        )
        const actual = generate(
          {
            cmd: 'subscribe',
            messageId: 1,
            subscriptions: [{ topic: 'test/properties', qos: 1 }],
            properties: buildProperties(Vue.observable({ userProperties })),
          },
          { protocolVersion: 5 },
        )
        expect(actual.equals(expected)).to.equal(true)
      })
    }
  })
})
