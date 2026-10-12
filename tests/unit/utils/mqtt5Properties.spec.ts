import { expect } from 'chai'
import { setMQTT5Properties, setWillMQTT5Properties } from '@/utils/mqtt5Properties'

describe('mqtt5Properties', () => {
  describe('setWillMQTT5Properties', () => {
    it('should return undefined when option is undefined', () => {
      expect(setWillMQTT5Properties(undefined as unknown as WillPropertiesModel)).to.equal(undefined)
    })

    it('should drop empty-string values produced by cleared number inputs (#2059)', () => {
      const result = setWillMQTT5Properties({
        willDelayInterval: '',
        messageExpiryInterval: '',
        contentType: '',
      } as unknown as WillPropertiesModel)
      expect(result).to.not.have.property('willDelayInterval')
      expect(result).to.not.have.property('messageExpiryInterval')
      expect(result).to.not.have.property('contentType')
    })

    it('should drop null and undefined values', () => {
      const result = setWillMQTT5Properties({
        willDelayInterval: null,
        messageExpiryInterval: undefined,
      } as unknown as WillPropertiesModel)
      expect(result).to.not.have.property('willDelayInterval')
      expect(result).to.not.have.property('messageExpiryInterval')
    })

    it('should keep valid values including 0 and false', () => {
      const result = setWillMQTT5Properties({
        willDelayInterval: 0,
        messageExpiryInterval: 120,
        payloadFormatIndicator: false,
        contentType: 'application/json',
      } as unknown as WillPropertiesModel)
      expect(result).to.deep.equal({
        willDelayInterval: 0,
        messageExpiryInterval: 120,
        payloadFormatIndicator: false,
        contentType: 'application/json',
      })
    })
  })

  describe('setMQTT5Properties', () => {
    it('should return undefined when properties is undefined', () => {
      expect(setMQTT5Properties({ clean: true } as ConnectionModel)).to.equal(undefined)
    })

    it('should drop empty-string values produced by cleared number inputs (#2059)', () => {
      const result = setMQTT5Properties({
        clean: true,
        properties: {
          sessionExpiryInterval: '',
          receiveMaximum: '',
          maximumPacketSize: '',
          topicAliasMaximum: '',
        },
      } as unknown as ConnectionModel)
      expect(result).to.not.have.property('sessionExpiryInterval')
      expect(result).to.not.have.property('receiveMaximum')
      expect(result).to.not.have.property('maximumPacketSize')
      expect(result).to.not.have.property('topicAliasMaximum')
    })

    it('should keep valid values including 0 and false', () => {
      const result = setMQTT5Properties({
        clean: true,
        properties: {
          sessionExpiryInterval: 0,
          receiveMaximum: 10,
          requestResponseInformation: false,
        },
      } as unknown as ConnectionModel)
      expect(result).to.deep.equal({
        sessionExpiryInterval: 0,
        receiveMaximum: 10,
        requestResponseInformation: false,
      })
    })

    it('should set sessionExpiryInterval to 0xFFFFFFFF when it is null and clean is false', () => {
      const result = setMQTT5Properties({
        clean: false,
        properties: {
          sessionExpiryInterval: null,
        },
      } as unknown as ConnectionModel)
      expect(result).to.have.property('sessionExpiryInterval', parseInt('0xFFFFFFFF', 16))
    })
  })
})
