<script setup lang="ts">
import { reactive } from 'vue'
import useLinks from '../../composables/useLinks'

const { linksMap } = useLinks()

const featMenus = reactive({
  connections: {
    icon: 'icon-connections',
    path: '/connections',
  },
  new: {
    icon: 'icon-new',
    path: '/connections',
  },
  script: {
    icon: 'icon-script',
    path: '/connections',
  },
  log: {
    icon: 'icon-log',
    path: '/connections',
  },
})

const helpMenus = reactive({
  settings: {
    icon: 'icon-settings',
    path: '/connections',
  },
  mqtt: {
    icon: 'icon-mqtt',
    path: '/connections',
  },
  about: {
    icon: 'icon-about',
    path: '/connections',
  },
})
</script>

<template>
  <el-aside width="80px" class="flex flex-col justify-between items-center">
    <a :href="linksMap.homepage" target="_blank" rel="noopener noreferrer" class="w-[40px] h-[40px] block mt-12">
      <img src="../../assets/images/logo.png" alt="app-logo" width="40" height="40">
    </a>
    <div class="flex flex-col">
      <router-link v-for="menu in featMenus" :key="menu.path" :to="menu.path" class="no-underline mb-8 text-main-white">
        <i :class="`iconfont ${menu.icon} text-xl`" />
      </router-link>
    </div>
    <div class="flex flex-col">
      <router-link v-for="menu in helpMenus" :key="menu.path" :to="menu.path" class="no-underline mb-8 text-main-white">
        <i :class="`iconfont ${menu.icon} text-xl`" />
      </router-link>
    </div>
  </el-aside>
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
