<script setup lang="ts">
import { ElementI18nMap } from '@mqttx/ui/i18n'
import { useSettingsStore } from '@mqttx/ui/stores'

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
