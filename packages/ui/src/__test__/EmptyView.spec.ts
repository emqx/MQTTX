// ExampleComponent.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyView from '../components/common/EmptyView.vue'

describe('EmptyView', () => {
  it('should render correctly', () => {
    const wrapper = mount(EmptyView)
    expect(wrapper.text()).toContain('No Data!')
  })
})
