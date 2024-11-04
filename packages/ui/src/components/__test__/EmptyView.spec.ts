import { mount } from '@vue/test-utils'
// ExampleComponent.spec.ts
import { describe, expect, it } from 'vitest'
import EmptyView from '../common/EmptyView.vue'

describe('emptyView', () => {
  it('should render correctly', () => {
    const wrapper = mount(EmptyView)
    expect(wrapper.text()).toContain('No Data!')
  })
})
