<script setup lang="ts">
import IconDiscord from '~icons/custom/discord'
import IconSlack from '~icons/custom/slack'
import IconWeChat from '~icons/custom/wechat'
import IconX from '~icons/custom/x'
import logoDark from '../../assets/images/about/emq-logo-dark.png'
import logoLight from '../../assets/images/about/emq-logo-light.png'
import WeChatQRCode from '../../assets/images/about/wx_qr_code.png'
import { useSettingsStore } from '../../stores'

const { settings } = useSettingsStore()
const logo = computed(() => settings!.currentTheme === 'light' ? logoDark : logoLight)

const fullYear = new Date().getFullYear()
const { about } = useLinks()

const socialLinks = [
  {
    icon: IconX,
    name: 'X',
    link: 'https://twitter.com/EMQTech',
  },
  {
    icon: IconDiscord,
    name: 'Discord',
    link: 'https://discord.gg/xYGf3fQnES',
  },
  {
    icon: IconSlack,
    name: 'Slack',
    link: 'https://slack-invite.emqx.io/',
  },
]
</script>

<template>
  <div class="py-6 border-t border-t-border-default flex gap-6 items-center justify-between">
    <div class="flex items-center gap-2">
      <img :src="logo" alt="EMQ" width="40" height="12">
      <span class="text-default text-sm">
        &copy;{{ fullYear }}
        <a class="text-main-green" :href="about.EMQ" target="_blank" rel="noopener">
          EMQ
        </a>
        Technologies Inc.
      </span>
    </div>
    <div class="flex gap-3">
      <a
        v-for="{ icon, name, link } in socialLinks"
        :key="name"
        :href="link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <component :is="icon" class="w-5 h-5 text-light" />
      </a>
      <ElPopover
        v-if="settings?.currentLang === 'zh'"
        placement="top"
        width="30"
        trigger="click"
      >
        <img :src="WeChatQRCode" alt="WeChat QR Code" width="126" height="126">
        <template #reference>
          <div
            role="button"
            tabindex="0"
          >
            <component :is="IconWeChat" class="w-5 h-5 text-light" />
          </div>
        </template>
      </ElPopover>
    </div>
  </div>
</template>
