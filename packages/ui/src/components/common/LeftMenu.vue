<script setup lang="ts">
import IconAbout from '~icons/custom/about'
import IconConnections from '~icons/custom/connections'
import IconLog from '~icons/custom/log'
import IconMqtt from '~icons/custom/mqtt'
import IconNew from '~icons/custom/new'
import IconScript from '~icons/custom/script'
import IconSettings from '~icons/custom/settings'
import { reactive } from 'vue'

import useLinks from '../../composables/useLinks'

const { linksMap } = useLinks()

const featMenus = reactive({
  connections: {
    icon: IconConnections,
    path: '/connections',
  },
  new: {
    icon: IconNew,
    path: '/new',
  },
  script: {
    icon: IconScript,
    path: '/script',
  },
  log: {
    icon: IconLog,
    path: '/log',
  },
})

const helpMenus = reactive({
  settings: {
    icon: IconSettings,
    path: '/settings',
  },
  mqtt: {
    icon: IconMqtt,
    path: '/mqtt',
  },
  about: {
    icon: IconAbout,
    path: '/about',
  },
})
</script>

<template>
  <ElAside width="80px" class="flex flex-col justify-between items-center">
    <a :href="linksMap.homepage" target="_blank" rel="noopener noreferrer" class="w-[40px] h-[40px] block mt-12">
      <img src="../../assets/images/logo.png" alt="app-logo" width="40" height="40">
    </a>
    <div class="flex flex-col">
      <RouterLink v-for="menu in featMenus" :key="menu.path" :to="menu.path" class="no-underline mb-8 text-main-white">
        <component :is="menu.icon" class="text-xl" />
      </RouterLink>
    </div>
    <div class="flex flex-col">
      <RouterLink v-for="menu in helpMenus" :key="menu.path" :to="menu.path" class="no-underline mb-8 text-main-white">
        <component :is="menu.icon" class="text-xl" />
      </RouterLink>
    </div>
  </ElAside>
</template>

<style lang="scss">
.el-aside {
  background: linear-gradient(135deg, var(--color-bg-leftbar_top) 0%, var(--color-bg-leftbar_bottom) 100%);
  -webkit-app-region: drag;
  a {
    -webkit-app-region: no-drag;
  }
}
</style>
