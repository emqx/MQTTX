import type { Lang } from 'mqttx'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import useLinks from '../useLinks'

describe('useLinks', () => {
  const i18n = createI18n({
    locale: 'en',
    messages: {
      en: {},
      zh: {},
      ja: {},
      hu: {},
      tr: {},
    },
  })

  const setupI18n = (locale: Lang) => {
    i18n.global.locale = locale
    return nextTick()
  }

  const createTestComponent = () => {
    return defineComponent({
      setup() {
        return useLinks()
      },
      render() {
        return h('div')
      },
    })
  }

  it('should return correct MQTTXSite based on locale', async () => {
    await setupI18n('zh')
    const wrapper = mount(createTestComponent(), { global: { plugins: [i18n] } })
    expect(wrapper.vm.MQTTXSite).toBe('https://mqttx.app/zh')

    await setupI18n('en')
    expect(wrapper.vm.MQTTXSite).toBe('https://mqttx.app')

    await setupI18n('ja')
    expect(wrapper.vm.MQTTXSite).toBe('https://mqttx.app/ja')
  })

  it('should return correct EMQSite based on locale', async () => {
    await setupI18n('zh')
    const wrapper = mount(createTestComponent(), { global: { plugins: [i18n] } })
    expect(wrapper.vm.EMQSite).toBe('https://emqx.com/zh')

    await setupI18n('ja')
    expect(wrapper.vm.EMQSite).toBe('https://emqx.com/ja')

    await setupI18n('hu')
    expect(wrapper.vm.EMQSite).toBe('https://emqx.com/en')
  })

  it('should return correct forumSite based on locale', async () => {
    await setupI18n('zh')
    const wrapper = mount(createTestComponent(), { global: { plugins: [i18n] } })
    expect(wrapper.vm.forumSite).toBe('https://askemq.com/c/tools/11')

    await setupI18n('en')
    expect(wrapper.vm.forumSite).toBe('https://github.com/emqx/MQTTX/discussions')
  })

  it('should return correct leftBarLogo', async () => {
    await setupI18n('zh')
    const wrapper = mount(createTestComponent(), { global: { plugins: [i18n] } })
    expect(wrapper.vm.leftBarLogo).toBe('https://mqttx.app/zh?utm_source=mqttx&utm_medium=referral&utm_campaign=logo-to-homepage')

    await setupI18n('en')
    expect(wrapper.vm.leftBarLogo).toBe('https://mqttx.app?utm_source=mqttx&utm_medium=referral&utm_campaign=logo-to-homepage')
  })

  it('should return correct empty links', async () => {
    await setupI18n('zh')
    const wrapper = mount(createTestComponent(), { global: { plugins: [i18n] } })
    expect(wrapper.vm.empty).toEqual({
      EMQX: 'https://emqx.com/zh/products/emqx?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-emqx',
      EMQXCloud: 'https://emqx.com/zh/cloud?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-cloud',
    })

    await setupI18n('en')
    expect(wrapper.vm.empty).toEqual({
      EMQX: 'https://emqx.com/en/products/emqx?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-emqx',
      EMQXCloud: 'https://emqx.com/en/cloud?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-cloud',
    })
  })

  it('should return correct about links', async () => {
    await setupI18n('zh')
    window.__APP_VERSION__ = '2.0.0'
    const wrapper = mount(createTestComponent(), { global: { plugins: [i18n] } })
    expect(wrapper.vm.about).toEqual({
      releases: 'https://mqttx.app/zh/changelogs/v2.0.0?utm_source=mqttx&utm_medium=referral&utm_campaign=about-to-release',
      faq: 'https://mqttx.app/zh/docs/faq?utm_source=mqttx&utm_medium=referral&utm_campaign=about-to-faq',
      MQTTX: 'https://mqttx.app/zh?utm_source=mqttx&utm_medium=referral&utm_campaign=about-to-mqttx',
      EMQ: 'https://emqx.com/zh?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-homepage',
      EMQXCloud: 'https://emqx.com/zh/cloud?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-cloud',
    })

    await setupI18n('en')
    expect(wrapper.vm.about).toEqual({
      releases: 'https://mqttx.app/changelogs/v2.0.0?utm_source=mqttx&utm_medium=referral&utm_campaign=about-to-release',
      faq: 'https://mqttx.app/docs/faq?utm_source=mqttx&utm_medium=referral&utm_campaign=about-to-faq',
      MQTTX: 'https://mqttx.app?utm_source=mqttx&utm_medium=referral&utm_campaign=about-to-mqttx',
      EMQ: 'https://emqx.com/en?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-homepage',
      EMQXCloud: 'https://emqx.com/en/cloud?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-to-cloud',
    })
  })

  it('should return correct help links', async () => {
    await setupI18n('zh')
    const wrapper = mount(createTestComponent(), { global: { plugins: [i18n] } })
    expect(wrapper.vm.help).toEqual({
      docs: 'https://mqttx.app/zh/docs?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-help-to-docs',
      forum: 'https://askemq.com/c/tools/11?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-help-to-forum',
      learnMQTT: 'https://emqx.com/zh/mqtt-guide?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-help-to-learn-mqtt',
      publicMqttBroker: 'https://emqx.com/zh/mqtt/public-mqtt5-broker',
      mqtt5: 'https://emqx.com/zh/blog/introduction-to-mqtt-5',
      blogUtm: '?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-help-to-blog',
    })

    await setupI18n('en')
    const wrapperEn = mount(createTestComponent(), { global: { plugins: [i18n] } })
    expect(wrapperEn.vm.help).toEqual({
      docs: 'https://mqttx.app/docs?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-help-to-docs',
      forum: 'https://github.com/emqx/MQTTX/discussions?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-help-to-forum',
      learnMQTT: 'https://emqx.com/en/mqtt-guide?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-help-to-learn-mqtt',
      publicMqttBroker: 'https://emqx.com/en/mqtt/public-mqtt5-broker',
      mqtt5: 'https://emqx.com/en/blog/introduction-to-mqtt-5',
      blogUtm: '?utm_source=mqttx&utm_medium=referral&utm_campaign=mqttx-help-to-blog',
    })
  })
})
