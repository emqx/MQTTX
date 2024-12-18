<script setup lang="ts">
import type { ProgressInfo } from 'electron-updater'
import useSettingsService from '@database/services/SettingsService'

const updateAvailableDialogVisible = ref(false)
const version = ref('')
const changelog = ref('')

const downloadProgressDialogVisible = ref(false)
const downloadProgress = ref<ProgressInfo | null>(null)
const updateDownloaded = ref(false)

const { t } = useI18n()

window.api.onUpdateStatus((_event, updateEvent) => {
  const { status } = updateEvent
  if (status === 'update-not-available') {
    if (window.forceCheck) {
      ElMessage({
        message: t('update.noUpdateAvailable'),
        type: 'info',
        plain: true,
      })
      window.forceCheck = false
    }
  } else if (status === 'update-available') {
    const ignoreVersion = localStorage.getItem('ignoreVersion')
    const { info, releaseNotes } = updateEvent.data
    if (!window.forceCheck && ignoreVersion && ignoreVersion === info.version) {
      return
    }
    updateAvailableDialogVisible.value = true
    version.value = info.version
    changelog.value = releaseNotes
    window.forceCheck = false
  } else if (status === 'download-progress') {
    downloadProgressDialogVisible.value = true
    downloadProgress.value = updateEvent.data
  } else if (status === 'update-downloaded') {
    downloadProgressDialogVisible.value = true
    updateDownloaded.value = true
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
    :release-notes="changelog"
  />
  <UpdateDownloadProgress
    v-model="downloadProgressDialogVisible"
    :download-progress="downloadProgress"
    :update-downloaded="updateDownloaded"
  />
</template>
