<script setup lang="ts">
import useSettingsService from '@database/services/SettingsService'

const { settings } = useSettingsService()

onMounted(async () => {
  if (settings.autoCheck) {
    window.api.checkForUpdates()
  }
})
</script>

<template>
  <div />
</template>
