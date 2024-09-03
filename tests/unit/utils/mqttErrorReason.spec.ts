import { expect } from 'chai'
import getErrorReason from '@/utils/mqttErrorReason'

describe('mqttErrorReason', () => {
  describe('getErrorReason', () => {
    it('should return correct error reason for MQTT 3.1', () => {
      expect(getErrorReason('3.1', 128)).to.equal('Not authorized')
    })

    it('should return correct error reason for MQTT 3.1.1', () => {
      expect(getErrorReason('3.1.1', 128)).to.equal('Not authorized')
    })

    describe('MQTT 5.0', () => {
      it('should return correct error reasons for various codes', () => {
        expect(getErrorReason('5.0', 4)).to.equal('Disconnect with Will Message')
        expect(getErrorReason('5.0', 16)).to.equal('No matching subscribers')
        expect(getErrorReason('5.0', 128)).to.equal('Unspecified error')
        expect(getErrorReason('5.0', 135)).to.equal('Not authorized')
        expect(getErrorReason('5.0', 149)).to.equal('Packet too large')
        expect(getErrorReason('5.0', 162)).to.equal('Wildcard Subscriptions not supported')
      })

      it('should return "Unknown error" for undefined error codes', () => {
        expect(getErrorReason('5.0', 999)).to.equal('Unknown error')
      })
    })

    it('should return "Unknown error" for undefined versions', () => {
      // @ts-ignore: Intentionally passing an invalid version
      expect(getErrorReason('6.0', 128)).to.equal('Unknown error')
    })

    it('should handle edge cases', () => {
      expect(getErrorReason('5.0', 0)).to.equal('Unknown error')
      expect(getErrorReason('5.0', -1)).to.equal('Unknown error')
      // @ts-ignore: Intentionally passing an invalid version
      expect(getErrorReason(undefined, 128)).to.equal('Unknown error')
      // @ts-ignore: Intentionally passing an invalid version
      expect(getErrorReason(null, 128)).to.equal('Unknown error')
    })
  })

  describe('Error code coverage', () => {
    it('should have all MQTT 5.0 error codes defined', () => {
      const definedCodes = [
        4, 16, 17, 24, 25, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145,
        146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162,
      ]

      definedCodes.forEach((code) => {
        expect(getErrorReason('5.0', code)).to.not.equal('Unknown error', `Error code ${code} should be defined`)
      })
    })
  })

  describe('Version compatibility', () => {
    it('should have consistent "Not authorized" message across versions', () => {
      const notAuthorizedMessage = 'Not authorized'
      expect(getErrorReason('3.1', 128)).to.equal(notAuthorizedMessage)
      expect(getErrorReason('3.1.1', 128)).to.equal(notAuthorizedMessage)
      expect(getErrorReason('5.0', 135)).to.equal(notAuthorizedMessage)
    })
  })
})
