<script setup lang="ts">
import { useSettingsStore } from '@mqttx/ui'
import { ElementI18nMap } from '@mqttx/ui'

const settingsStore = useSettingsStore()
console.log('MQTTX Web App init...')
</script>

<template>
  <ElConfigProvider :locale="ElementI18nMap[settingsStore.lang]">
    <ElContainer>
      <CommonLeftMenu />
      <CommonMainView />
    </ElContainer>
  </ElConfigProvider>
</template>
