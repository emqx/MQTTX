<script setup lang="ts">
import IconAbout from '~icons/custom/about'
import IconConnections from '~icons/custom/connections'
import IconLog from '~icons/custom/log'
import IconMqtt from '~icons/custom/mqtt'
import IconNew from '~icons/custom/new'
import IconScript from '~icons/custom/script'
import IconSettings from '~icons/custom/settings'

const { leftBarLogo } = useLinks()

interface MenuItem {
  icon: any
  path: string
}

interface Menus {
  top: Record<string, MenuItem>
  bottom: Record<string, MenuItem>
}

const menus = reactive<Menus>({
  top: {
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
  },
  bottom: {
    settings: {
      icon: IconSettings,
      path: '/settings',
    },
    mqtt: {
      icon: IconMqtt,
      path: '/help',
    },
    about: {
      icon: IconAbout,
      path: '/about',
    },
  },
})
</script>

<template>
  <ElAside width="80px" :class="$style.aside">
    <a :href="leftBarLogo" target="_blank" rel="noopener" class="w-[40px] h-[40px] block">
      <img src="../../assets/images/logo.png" alt="MQTTX" width="40" height="40">
    </a>
    <div
      v-for="(menuGroup, index) in menus"
      :key="index"
      class="flex flex-col"
    >
      <RouterLink
        v-for="{ path, icon } in menuGroup"
        :key="path"
        :to="path"
        :class="$style.item"
        :active-class="$style['item-active']"
      >
        <component :is="icon" class="text-xl" />
      </RouterLink>
    </div>
  </ElAside>
</template>

<style module>
.aside {
  @apply z-[1001] py-10 flex flex-col gap-8 justify-between items-center border-r border-r-border-leftbar;
  background: linear-gradient(135deg, var(--color-bg-leftbar_top) 0%, var(--color-bg-leftbar_bottom) 100%);
}

.item {
  @apply flex justify-center items-center w-12 h-12 mb-3 last:mb-0 rounded-lg text-leftbar-icon transition-colors;
  &:hover {
    @apply text-main-white;
  }
}

.item-active {
  @apply text-main-white bg-leftbar-item;
}
</style>
