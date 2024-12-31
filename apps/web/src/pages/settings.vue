<script setup lang="ts">
import { useSettingsService } from '@/database/services'

const { settings } = useSettingsService()

const { MQTTXSite } = useLinks()

function installCli() {
  const link = `${MQTTXSite.value}/cli#download`
  window.open(link, '_blank')
}
</script>

<template>
  <SettingsView
    v-model="settings"
    @install-cli="installCli"
  />
</template>
