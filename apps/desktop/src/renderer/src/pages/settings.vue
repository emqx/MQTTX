<script setup lang="ts">
import useSettingsService from '@database/services/SettingsService'

const { settings } = useSettingsService()

function installCli() {
  // TODO: implement this function
  console.log('installCli')
}
</script>

<template>
  <SettingsView
    v-model="settings"
    @install-cli="installCli"
  />
</template>
