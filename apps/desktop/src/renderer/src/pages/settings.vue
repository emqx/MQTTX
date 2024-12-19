<script setup lang="ts">
import useSettingsService from '@database/services/SettingsService'

const { settings } = useSettingsService()

const intallCliBtnLoading = ref(false)

async function installCli() {
  try {
    intallCliBtnLoading.value = true
    await window.api.installCLI()
  } catch (error) {
    console.error(error)
  } finally {
    intallCliBtnLoading.value = false
  }
}

const cliDownloadProgressVisible = ref(false)
const cliDownloadProgressPercent = ref<number | null>(null)
const cliDownloaded = ref(false)

window.api.onInstallCLIStatus((_event, cliDownloadEvent) => {
  const { status } = cliDownloadEvent
  if (status === 'download-progress') {
    cliDownloadProgressVisible.value = true
    cliDownloadProgressPercent.value = cliDownloadEvent.data.percent
  } else if (status === 'cli-downloaded') {
    cliDownloaded.value = true
    cliDownloadProgressVisible.value = false
  }
})
</script>

<template>
  <SettingsView
    v-model="settings"
    :install-cli-btn-loading="intallCliBtnLoading"
    @install-cli="installCli"
  />
  <SettingsCliDownloadProgress
    v-model="cliDownloadProgressVisible"
    :percent="cliDownloadProgressPercent"
    :update-downloaded="cliDownloaded"
  />
</template>
