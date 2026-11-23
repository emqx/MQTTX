import { expect } from 'chai'
import { Dialog } from 'element-ui'
import { shallowMount } from '@vue/test-utils'
import Update from '@/views/update/index.vue'

describe('Desktop update dialog', () => {
  it('shows the available version in the title when the release notes omit it', async () => {
    const wrapper = shallowMount(Update, {
      mocks: {
        $store: { getters: { autoCheck: false } },
        $t: (key: string) => (key === 'update.updateTitle' ? '有可用更新' : key),
      },
      stubs: { 'el-dialog': Dialog, 'el-button': true, 'el-progress': true },
    })

    try {
      await wrapper.setData({ version: 'v1.13.3' })
      expect(wrapper.find('.update-dialog .el-dialog__title').text()).to.equal('有可用更新 v1.13.3')
    } finally {
      wrapper.destroy()
    }
  })
})
