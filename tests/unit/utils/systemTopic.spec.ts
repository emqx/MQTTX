import { expect } from 'chai'
import {
  transformTrafficMessages,
  calculateTrafficRates,
  mergeMetrics,
  calculateAverageRate,
  calculateRate,
} from '@/utils/systemTopic'

describe('systemTopic utils', () => {
  describe('transformTrafficMessages', () => {
    it('should transform and merge traffic messages correctly', () => {
      const testMessages: MessageModel[] = [
        {
          id: '1',
          topic: '/metrics/bytes/received',
          payload: '100',
          createAt: '2024-03-20 10:00:00:000',
          out: false,
          qos: 0,
          retain: false,
          color: '#1890ff',
        },
        {
          id: '2',
          topic: '/metrics/bytes/sent',
          payload: '200',
          createAt: '2024-03-20 10:00:00:100',
          out: false,
          qos: 0,
          retain: false,
          color: '#52c41a',
        },
        {
          id: '3',
          topic: '/metrics/bytes/received',
          payload: '300',
          createAt: '2024-03-20 10:00:02:000',
          out: false,
          qos: 0,
          retain: false,
          color: '#1890ff',
        },
      ]

      const result = transformTrafficMessages(testMessages)

      expect(result).to.deep.equal([
        {
          label: '2024-03-20 10:00:00:000',
          received: 100,
          sent: 200,
        },
        {
          label: '2024-03-20 10:00:02:000',
          received: 300,
          sent: 0,
        },
      ])
    })

    it('should handle empty message array', () => {
      const result = transformTrafficMessages([])
      expect(result).to.deep.equal([])
    })

    it('should handle invalid payload messages', () => {
      const testMessages: MessageModel[] = [
        {
          id: '1',
          topic: '/metrics/bytes/received',
          payload: 'invalid',
          createAt: '2024-03-20 10:00:00:000',
          out: false,
          qos: 0,
          retain: false,
        },
      ]

      const result = transformTrafficMessages(testMessages)
      expect(result).to.deep.equal([])
    })

    it('should handle non-metrics topics', () => {
      const testMessages: MessageModel[] = [
        {
          id: '1',
          topic: '/other/topic',
          payload: '100',
          createAt: '2024-03-20 10:00:00:000',
          out: false,
          qos: 0,
          retain: false,
        },
      ]

      const result = transformTrafficMessages(testMessages)
      expect(result).to.deep.equal([])
    })
  })

  describe('calculateTrafficRates', () => {
    it('should calculate traffic rates correctly', () => {
      const testMetrics: MetricsModel[] = [
        {
          label: '2024-03-20 10:00:00:000',
          received: 100,
          sent: 200,
        },
        {
          label: '2024-03-20 10:00:10:000',
          received: 300,
          sent: 400,
        },
      ]

      const result = calculateTrafficRates(testMetrics)

      expect(result).to.deep.equal([
        {
          label: '2024-03-20 10:00:10:000',
          received: 20, // (300 - 100) / 10 seconds
          sent: 20, // (400 - 200) / 10 seconds
        },
      ])
    })

    it('should handle counter reset (negative differences)', () => {
      const testMetrics: MetricsModel[] = [
        {
          label: '2024-03-20 10:00:00:000',
          received: 300,
          sent: 400,
        },
        {
          label: '2024-03-20 10:00:10:000',
          received: 100,
          sent: 200,
        },
      ]

      const result = calculateTrafficRates(testMetrics)

      expect(result).to.deep.equal([
        {
          label: '2024-03-20 10:00:10:000',
          received: 0,
          sent: 0,
        },
      ])
    })

    it('should handle single metric data point', () => {
      const testMetrics: MetricsModel[] = [
        {
          label: '2024-03-20 10:00:00:000',
          received: 100,
          sent: 200,
        },
      ]

      const result = calculateTrafficRates(testMetrics)
      expect(result).to.deep.equal([])
    })

    it('should handle zero time difference', () => {
      const testMetrics: MetricsModel[] = [
        {
          label: '2024-03-20 10:00:00:000',
          received: 100,
          sent: 200,
        },
        {
          label: '2024-03-20 10:00:00:000',
          received: 300,
          sent: 400,
        },
      ]

      const result = calculateTrafficRates(testMetrics)

      expect(result).to.deep.equal([
        {
          label: '2024-03-20 10:00:00:000',
          received: 0,
          sent: 0,
        },
      ])
    })

    it('should handle invalid time format', () => {
      const testMetrics: MetricsModel[] = [
        {
          label: 'invalid-time',
          received: 100,
          sent: 200,
        },
        {
          label: 'invalid-time-2',
          received: 300,
          sent: 400,
        },
      ]

      const result = calculateTrafficRates(testMetrics)
      expect(result).to.deep.equal([
        {
          label: 'invalid-time-2',
          received: NaN,
          sent: NaN,
        },
      ])
    })
  })

  describe('mergeMetrics', () => {
    it('should merge metrics with same timestamp', () => {
      const metrics: MetricsModel[] = [
        {
          label: '2024-03-20 10:00:00:000',
          received: 100,
          sent: 0,
        },
        {
          label: '2024-03-20 10:00:00:000',
          received: 0,
          sent: 200,
        },
      ]

      const result = mergeMetrics(metrics)
      expect(result).to.deep.equal([
        {
          label: '2024-03-20 10:00:00:000',
          received: 100,
          sent: 200,
        },
      ])
    })

    it('should handle empty metrics array', () => {
      const result = mergeMetrics([])
      expect(result).to.deep.equal([])
    })

    it('should keep metrics with different timestamps', () => {
      const metrics: MetricsModel[] = [
        {
          label: '2024-03-20 10:00:00:000',
          received: 100,
          sent: 200,
        },
      ]

      const result = mergeMetrics(metrics)
      expect(result).to.deep.equal([
        {
          label: '2024-03-20 10:00:00:000',
          received: 100,
          sent: 200,
        },
      ])
    })

    it('should merge multiple metrics with same timestamp', () => {
      const metrics: MetricsModel[] = [
        {
          label: '2024-03-20 10:00:00:000',
          received: 100,
          sent: 0,
        },
        {
          label: '2024-03-20 10:00:00:000',
          received: 0,
          sent: 300,
        },
      ]

      const result = mergeMetrics(metrics)
      expect(result).to.deep.equal([
        {
          label: '2024-03-20 10:00:00:000',
          received: 100,
          sent: 300,
        },
      ])
    })
  })

  describe('calculateAverageRate', () => {
    it('should calculate average rate correctly', () => {
      expect(calculateAverageRate(300, 100, 10)).to.equal(20) // (300 - 100) / 10
    })

    it('should return 0 for negative differences', () => {
      expect(calculateAverageRate(100, 300, 10)).to.equal(0)
    })

    it('should return 0 for zero or negative time difference', () => {
      expect(calculateAverageRate(300, 100, 0)).to.equal(0)
      expect(calculateAverageRate(300, 100, -1)).to.equal(0)
    })

    it('should handle large numbers', () => {
      expect(calculateAverageRate(1000000, 0, 10)).to.equal(100000)
    })
  })

  describe('calculateRate', () => {
    it('should calculate rates correctly', () => {
      const current: MetricsModel = {
        label: '2024-03-20 10:00:10:000',
        received: 300,
        sent: 400,
      }
      const previous: MetricsModel = {
        label: '2024-03-20 10:00:00:000',
        received: 100,
        sent: 200,
      }

      const result = calculateRate(current, previous)
      expect(result).to.deep.equal({
        label: '2024-03-20 10:00:10:000',
        received: 20, // (300 - 100) / 10
        sent: 20, // (400 - 200) / 10
      })
    })

    it('should handle zero time difference', () => {
      const current: MetricsModel = {
        label: '2024-03-20 10:00:00:000',
        received: 300,
        sent: 400,
      }
      const previous: MetricsModel = {
        label: '2024-03-20 10:00:00:000',
        received: 100,
        sent: 200,
      }

      const result = calculateRate(current, previous)
      expect(result).to.deep.equal({
        label: '2024-03-20 10:00:00:000',
        received: 0,
        sent: 0,
      })
    })

    it('should handle negative time difference', () => {
      const current: MetricsModel = {
        label: '2024-03-20 10:00:00:000',
        received: 300,
        sent: 400,
      }
      const previous: MetricsModel = {
        label: '2024-03-20 10:00:10:000',
        received: 100,
        sent: 200,
      }

      const result = calculateRate(current, previous)
      expect(result).to.deep.equal({
        label: '2024-03-20 10:00:00:000',
        received: 0,
        sent: 0,
      })
    })

    it('should handle counter reset', () => {
      const current: MetricsModel = {
        label: '2024-03-20 10:00:10:000',
        received: 100,
        sent: 200,
      }
      const previous: MetricsModel = {
        label: '2024-03-20 10:00:00:000',
        received: 300,
        sent: 400,
      }

      const result = calculateRate(current, previous)
      expect(result).to.deep.equal({
        label: '2024-03-20 10:00:10:000',
        received: 0,
        sent: 0,
      })
    })
  })
})
