import { expect } from 'chai'
import { createLocalVue, mount } from '@vue/test-utils'
import ElementUI from 'element-ui'
import Vue from 'vue'
import KeyValueEditor from '@/components/KeyValueEditor.vue'
import WebKeyValueEditor from '../../../web/src/components/KeyValueEditor.vue'

const localVue = createLocalVue()
localVue.use(ElementUI)

for (const [name, component] of [
  ['desktop', KeyValueEditor],
  ['web', WebKeyValueEditor],
] as const) {
  describe(`${name} KeyValueEditor`, () => {
    it('clears the visible draft when the parent resets the user properties', async () => {
      const wrapper = mount<Vue>(component, { localVue, propsData: { value: { 'stream-offset': 'earliest' } } })
      try {
        wrapper.setProps({ value: undefined })
        await localVue.nextTick()
        expect(
          (wrapper.find('.user-prop-key input, .user-prop-key textarea').element as HTMLInputElement).value,
        ).to.equal('')
        wrapper.setProps({ value: { 'stream-offset': 'latest' } })
        await localVue.nextTick()
        expect(
          (wrapper.find('.user-prop-value input, .user-prop-value textarea').element as HTMLInputElement).value,
        ).to.equal('latest')
      } finally {
        wrapper.destroy()
      }
    })

    it('preserves repeated user properties when the first value is empty', async () => {
      const wrapper = mount<Vue>(component, { localVue, propsData: { value: { tag: ['', 'second'] } } })
      try {
        wrapper.findAll('.user-prop-value').at(1).find('input, textarea').setValue('updated')
        await localVue.nextTick()
        expect(wrapper.emitted('change')?.pop()?.[0]).to.deep.equal({ tag: ['', 'updated'] })
      } finally {
        wrapper.destroy()
      }
    })

    it('treats JavaScript prototype names as ordinary user property keys', async () => {
      const wrapper = mount<Vue>(component, {
        localVue,
        propsData: { value: JSON.parse('{"__proto__":"first","constructor":"second"}') },
      })
      try {
        wrapper.findAll('.user-prop-value').at(1).find('input, textarea').setValue('updated')
        await localVue.nextTick()
        expect(JSON.stringify(wrapper.emitted('change')?.pop()?.[0])).to.equal(
          '{"__proto__":"first","constructor":"updated"}',
        )
      } finally {
        wrapper.destroy()
      }
    })
  })
}
