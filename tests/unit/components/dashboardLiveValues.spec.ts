import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import { shallowMount, Wrapper } from '@vue/test-utils'
import { Container } from 'typedi'
import DashboardView from '@/views/viewer/dashboard/DashboardView.vue'
import MessageService from '@/database/services/MessageService'
import { globalEventBus } from '@/utils/globalEventBus'

/**
 * A freshly created dashboard uses the last 24 hours, which is a live window: messages arriving after
 * the page was opened must still reach the widgets. Before the fix the default mode was static, so
 * `shouldProcessMessage` dropped every message that arrived after the frozen range end.
 */
describe('Dashboard live values with the default settings', () => {
  const widgets: WidgetModel[] = [
    {
      id: 'line',
      type: 'Line',
      title: 'Temperature',
      topicPattern: 'e2e/j01/+/env',
      valueField: 'temp',
      connectionId: 'connection',
      dashboardId: 'dashboard',
      fallbackValue: 0,
      x: 0,
      y: 0,
      w: 4,
      h: 6,
    },
    {
      id: 'gauge',
      type: 'Gauge',
      title: 'Humidity',
      topicPattern: 'e2e/j01/+/env',
      valueField: 'humidity',
      connectionId: 'connection',
      dashboardId: 'dashboard',
      fallbackValue: 0,
      x: 0,
      y: 6,
      w: 4,
      h: 6,
    },
  ]

  it('updates the Line series and the final Gauge value from incoming messages', async () => {
    const originalGet = Container.get
    Container.get = ((type: unknown) =>
      type === MessageService ? { getMessagesByTopicPattern: async () => [] } : {}) as typeof Container.get
    let wrapper: Wrapper<Vue> | undefined
    try {
      wrapper = shallowMount(DashboardView, {
        propsData: { widgets },
        stubs: ['el-tooltip', 'el-dropdown', 'el-dropdown-menu', 'el-dropdown-item'],
      })
      await new Promise((resolve) => setTimeout(resolve, 0))

      for (const [temp, humidity] of [
        [21, 51],
        [22, 52],
        [23, 53],
        [24, 54],
        [25, 55],
      ]) {
        globalEventBus.emit(
          'packetReceive',
          {
            cmd: 'publish',
            topic: 'e2e/j01/line1/env',
            payload: Buffer.from(JSON.stringify({ temp, humidity })),
            qos: 1,
            retain: false,
          },
          { id: 'connection' },
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 1100))
      await wrapper.vm.$nextTick()

      const data = new Map<string, any>(
        wrapper
          .findAll({ name: 'WidgetRenderer' })
          .wrappers.map((renderer) => [renderer.props('widget').id as string, renderer.props('data')]),
      )
      expect(data.get('line').chartData.seriesData[0].data).to.deep.equal([21, 22, 23, 24, 25])
      expect(data.get('gauge').value).to.equal(55)
    } finally {
      wrapper?.destroy()
      Container.get = originalGet
    }
  })
})
