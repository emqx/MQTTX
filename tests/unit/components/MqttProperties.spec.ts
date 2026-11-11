import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import MqttProperties from '@/components/MqttProperties.vue'

describe('Read-only MQTT User Properties', () => {
  it('renders repeated keys in entry and value order as selectable text', () => {
    const wrapper = shallowMount(MqttProperties, {
      propsData: { properties: { userProperties: { first: ['one', 'two'], second: 'three', empty: '' } } },
      mocks: { $t: (key: string) => key },
    })
    expect(
      wrapper
        .findAll('.property-row')
        .wrappers.map((row) => [row.find('.property-key').text(), row.find('.property-value').text()]),
    ).to.deep.equal([
      ['first', 'one'],
      ['first', 'two'],
      ['second', 'three'],
      ['empty', ''],
    ])
    expect(wrapper.find('textarea').exists()).to.equal(false)
    wrapper.destroy()
  })

  it('escapes markup and preserves multiline property values', () => {
    const wrapper = shallowMount(MqttProperties, {
      propsData: { properties: { userProperties: { key: '<script>\nvalue' } } },
      mocks: { $t: (key: string) => key },
    })
    expect(wrapper.find('.property-value').element.textContent).to.equal('<script>\nvalue')
    expect(wrapper.find('script').exists()).to.equal(false)
    wrapper.destroy()
  })
})
