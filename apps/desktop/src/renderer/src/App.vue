<script setup lang="ts">
import { useSettingsStore } from '@mqttx/ui'
import { ElementI18nMap } from '@mqttx/ui'

const settingsStore = useSettingsStore()
console.log('MQTTX Desktop App init...')
</script>

<template>
  <el-config-provider :locale="ElementI18nMap[settingsStore.lang]">
    <el-container>
      <left-menu />
      <main-view />
    </el-container>
  </el-config-provider>
</template>

<style lang="scss" scoped></style>
