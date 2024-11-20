<script setup lang="ts">
import { useSettingsStore } from '@mqttx/ui'

const { settings } = useSettingsStore()
</script>

<template>
  <SettingsView v-model="settings" />
</template>
