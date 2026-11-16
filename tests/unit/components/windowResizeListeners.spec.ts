import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import ConnectionsDetail from '@/views/connections/ConnectionsDetail.vue'
import LineChartExtent from '@/components/charts/LineChartExtent.vue'
import Update from '@/views/update/index.vue'

describe('Desktop window resize listener lifecycle', () => {
  const components = [
    { name: 'ConnectionsDetail', component: ConnectionsDetail, hook: 'mounted', initialCalls: 1 },
    { name: 'LineChartExtent', component: LineChartExtent, hook: 'mounted', initialCalls: 0 },
    { name: 'Update', component: Update, hook: 'created', initialCalls: 0 },
  ]

  for (const { name, component, hook, initialCalls } of components) {
    it(`${name} removes its own handler and stops resizing after 100 create/destroy cycles`, async () => {
      const options = (component as any).options
      const originalAdd = window.addEventListener
      const originalRemove = window.removeEventListener
      const originalObserver = global.ResizeObserver
      const added: EventListenerOrEventListenerObject[] = []
      const removed: EventListenerOrEventListenerObject[] = []
      const listeners = new Set<EventListenerOrEventListenerObject>()
      const calls: number[] = []
      const instances: Vue[] = []
      let disposals = 0

      window.addEventListener = (
        type: string,
        listener: EventListenerOrEventListenerObject,
        eventOptions?: boolean | AddEventListenerOptions,
      ) => {
        if (type === 'resize') {
          added.push(listener)
          listeners.add(listener)
        }
        originalAdd.call(window, type, listener, eventOptions)
      }
      window.removeEventListener = (
        type: string,
        listener: EventListenerOrEventListenerObject,
        eventOptions?: boolean | EventListenerOptions,
      ) => {
        if (type === 'resize') {
          removed.push(listener)
          listeners.delete(listener)
        }
        originalRemove.call(window, type, listener, eventOptions)
      }
      // The connection page observes its topbar in addition to listening on window.
      global.ResizeObserver = class {
        observe() {}
        disconnect() {}
      } as any

      try {
        for (let cycle = 0; cycle < 100; cycle++) {
          calls[cycle] = 0
          const resize = () => calls[cycle]++
          // Keep the real methods and relevant hooks without loading connections or rendering a chart.
          const vm = new Vue({
            data: () => ({
              autoCheck: false,
              areaLineChart: { resize, dispose: () => disposals++ },
            }),
            methods: {
              ...options.methods,
              setMessageListHeight: resize,
              setDialogSize: resize,
              initChart() {},
              stopTimedSend() {},
              forceStopToReconnect() {},
            },
            beforeDestroy: options.beforeDestroy,
          })
          instances.push(vm)
          for (const start of options[hook]) {
            await start.call(vm)
          }
          expect(calls[cycle]).to.equal(initialCalls)
          window.dispatchEvent(new Event('resize'))
          expect(calls[cycle]).to.equal(initialCalls + 1)
          vm.$destroy()
        }

        calls.fill(0)
        window.dispatchEvent(new Event('resize'))
        expect(added).to.have.lengthOf(100)
        expect(removed).to.have.lengthOf(100)
        expect({
          sameHandlers: added.every((handler, index) => handler === removed[index]),
          remainingListeners: listeners.size,
          callsAfterDestroy: calls.reduce((total, count) => total + count, 0),
        }).to.deep.equal({ sameHandlers: true, remainingListeners: 0, callsAfterDestroy: 0 })
        if (name === 'LineChartExtent') {
          expect(disposals).to.equal(100)
        }
      } finally {
        for (const vm of instances) vm.$destroy()
        for (const listener of added) originalRemove.call(window, 'resize', listener)
        window.addEventListener = originalAdd
        window.removeEventListener = originalRemove
        global.ResizeObserver = originalObserver
      }
    })
  }
})
