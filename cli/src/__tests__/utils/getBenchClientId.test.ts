import { expect, describe, it } from '@jest/globals'
import getBenchClientId from '../../utils/getBenchClientId'

describe('getBenchClientId', () => {
  describe('single connection (count = 1)', () => {
    it('should return original clientId when no placeholder', () => {
      expect(getBenchClientId('mqtt_client', 1, 1)).toBe('mqtt_client')
    })

    it('should replace %i when has placeholder', () => {
      expect(getBenchClientId('mqtt_client_%i', 1, 1)).toBe('mqtt_client_1')
    })
  })

  describe('multiple connections (count > 1)', () => {
    it('should append index when no placeholder', () => {
      expect(getBenchClientId('mqtt_client', 1, 5)).toBe('mqtt_client_1')
    })

    it('should replace %i when has placeholder', () => {
      expect(getBenchClientId('mqtt_client_%i', 2, 5)).toBe('mqtt_client_2')
    })

    it('should handle multiple %i placeholders', () => {
      expect(getBenchClientId('mqtt_%i_client_%i', 3, 5)).toBe('mqtt_3_client_3')
    })
  })

  describe('edge cases', () => {
    it('should handle empty clientId', () => {
      expect(getBenchClientId('', 1, 5)).toBe('_1')
    })

    it('should handle clientId with only %i', () => {
      expect(getBenchClientId('%i', 1, 5)).toBe('1')
    })
  })
})
