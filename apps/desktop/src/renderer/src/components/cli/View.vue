<script setup lang="ts">
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
  <CliDownloadProgress
    v-model="cliDownloadProgressVisible"
    :percent="cliDownloadProgressPercent"
    :update-downloaded="cliDownloaded"
  />
</template>
