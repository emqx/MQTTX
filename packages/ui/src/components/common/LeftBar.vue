<script setup lang="ts">
import { reactive } from 'vue'
import useLinks from '../../composables/useLinks'

const { linksMap } = useLinks()

const menus = reactive({
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
</script>

<template>
  <el-aside width="80px" class="flex flex-col justify-between items-center">
    <a :href="linksMap.homepage" target="_blank" rel="noopener noreferrer" class="w-[40px] h-[40px] block mt-6">
      <img src="../../assets/images/logo.png" alt="app-logo" width="40" height="40" />
    </a>
    <div class="flex flex-col">
      <router-link v-for="menu in menus" :key="menu.path" :to="menu.path" class="no-underline mb-6">
        <i :class="`iconfont ${menu.icon} text-xl`"></i>
      </router-link>
    </div>
    <router-link to="/" class="no-underline mb-6">
      <i class="iconfont icon-help text-xl"></i>
    </router-link>
  </el-aside>
</template>

<style lang="scss">
.el-aside {
  background: linear-gradient(135deg, #2e424a 0%, #212b3b 100%);
  a {
    color: #fff;
  }
}
</style>
