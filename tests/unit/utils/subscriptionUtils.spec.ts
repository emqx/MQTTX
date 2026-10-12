import { expect } from 'chai'
import { hasPersistentSession, setSubscribeMQTT5Properties } from '@/utils/subscriptionUtils'
import {
  hasPersistentSession as webHasPersistentSession,
  setSubscribeMQTT5Properties as setWebSubscribeMQTT5Properties,
} from '../../../web/src/utils/subscriptionUtils'
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

  describe('hasPersistentSession', () => {
    const implementations = { desktop: hasPersistentSession, web: webHasPersistentSession }
    Object.entries(implementations).forEach(([name, check]) => {
      describe(name, () => {
        it('should be false when Clean Session / Clean Start is on', () => {
          expect(check({ clean: true, mqttVersion: '3.1.1' })).to.equal(false)
          expect(check({ clean: true, mqttVersion: '5.0', properties: { sessionExpiryInterval: 3600 } })).to.equal(
            false,
          )
        })

        it('should be true for MQTT 3.x with Clean Session off', () => {
          expect(check({ clean: false, mqttVersion: '3.1.1' })).to.equal(true)
          expect(check({ clean: false, mqttVersion: '3.1' })).to.equal(true)
        })

        it('should depend on Session Expiry Interval for MQTT 5.0 with Clean Start off', () => {
          expect(check({ clean: false, mqttVersion: '5.0', properties: { sessionExpiryInterval: 0 } })).to.equal(false)
          expect(
            check({ clean: false, mqttVersion: '5.0', properties: { sessionExpiryInterval: undefined } }),
          ).to.equal(false)
          expect(check({ clean: false, mqttVersion: '5.0' })).to.equal(false)
          expect(check({ clean: false, mqttVersion: '5.0', properties: { sessionExpiryInterval: 3600 } })).to.equal(
            true,
          )
        })
      })
    })

    it('should treat an empty desktop interval as never expiring, matching setMQTT5Properties', () => {
      expect(
        hasPersistentSession({ clean: false, mqttVersion: '5.0', properties: { sessionExpiryInterval: null } }),
      ).to.equal(true)
    })
  })
})
