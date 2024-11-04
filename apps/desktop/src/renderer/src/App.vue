<script setup lang="ts">
import { ElementI18nMap, useSettingsStore } from '@mqttx/ui'

const settingsStore = useSettingsStore()
console.log('MQTTX Desktop App init...')
</script>

<template>
  <ElConfigProvider :locale="ElementI18nMap[settingsStore.lang]">
    <ElContainer>
      <CommonLeftMenu />
      <CommonMainView />
    </ElContainer>
  </ElConfigProvider>
</template>
