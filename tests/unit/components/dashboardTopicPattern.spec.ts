import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import { shallowMount, Wrapper } from '@vue/test-utils'
import { Container } from 'typedi'
import DashboardView from '@/views/viewer/dashboard/DashboardView.vue'
import MessageService from '@/database/services/MessageService'
import { globalEventBus } from '@/utils/globalEventBus'

describe('Dashboard live widget topic patterns', () => {
  it('updates matching exact and wildcard widgets only for their connection', async () => {
    const widgets: WidgetModel[] = [
      ['exact', 'plant/temp'],
      ['single', 'plant/+'],
      ['multi', 'plant/#'],
      ['shared', '$share/dashboard/plant/+'],
      ['unmatched', 'weather/#'],
    ].map(([id, topicPattern]) => ({
      id,
      topicPattern,
      connectionId: 'connection',
      dashboardId: 'dashboard',
      type: 'Gauge',
      fallbackValue: 0,
      x: 0,
      y: 0,
      w: 3,
      h: 3,
    }))
    const originalGet = Container.get
    Container.get = ((type: unknown) =>
      type === MessageService ? { getMessagesByTopicPattern: async () => [] } : {}) as typeof Container.get
    let wrapper: Wrapper<Vue> | undefined
    try {
      wrapper = shallowMount(DashboardView, {
        propsData: { widgets, timeRangeType: 'live' },
        stubs: ['el-tooltip', 'el-dropdown', 'el-dropdown-menu', 'el-dropdown-item'],
      })
      await new Promise((resolve) => setTimeout(resolve, 0))
      for (const [topic, payload, connectionId] of [
        ['plant/temp', '42', 'connection'],
        ['plant/temp', '99', 'other-connection'],
        ['outside/value', '99', 'connection'],
      ]) {
        globalEventBus.emit(
          'packetReceive',
          { cmd: 'publish', topic, payload: Buffer.from(payload), qos: 0, retain: false },
          { id: connectionId },
        )
      }
      await new Promise((resolve) => setTimeout(resolve, 1100))
      await wrapper.vm.$nextTick()
      const values = wrapper.findAll({ name: 'WidgetRenderer' }).wrappers.map((renderer) => ({
        id: renderer.props('widget').id,
        value: renderer.props('data')?.value,
      }))
      expect(values).to.deep.equal([
        { id: 'exact', value: 42 },
        { id: 'single', value: 42 },
        { id: 'multi', value: 42 },
        { id: 'shared', value: 42 },
        { id: 'unmatched', value: undefined },
      ])
    } finally {
      wrapper?.destroy()
      Container.get = originalGet
    }
  })
})
