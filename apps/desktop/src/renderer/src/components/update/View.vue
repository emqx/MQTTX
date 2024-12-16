<script setup lang="ts">
import type { ProgressInfo } from 'electron-updater'
import useSettingsService from '@database/services/SettingsService'

const updateAvailableDialogVisible = ref(false)
const version = ref('')

const downloadProgressDialogVisible = ref(false)
const downloadProgress = ref<ProgressInfo | null>(null)

window.api.onUpdateStatus((_event, updateEvent) => {
  const { status } = updateEvent
  if (status === 'update-available') {
    const ignoreVersion = localStorage.getItem('ignoreVersion')
    if (!window.forceCheck && ignoreVersion && ignoreVersion === updateEvent.data.version) {
      return
    }
    updateAvailableDialogVisible.value = true
    version.value = updateEvent.data.version
    window.forceCheck = false
  } else if (status === 'download-progress') {
    downloadProgressDialogVisible.value = true
    downloadProgress.value = updateEvent.data
  } else if (status === 'error') {
    ElMessage({
      message: updateEvent.data.message,
      type: 'error',
      plain: true,
    })
  }
})

const { settings } = useSettingsService()

onMounted(async () => {
  if (settings.autoCheck) {
    window.api.checkForUpdates()
  }
})
</script>

<template>
  <UpdateAvailable
    v-model="updateAvailableDialogVisible"
    :version="version"
  />
</template>
