<script setup lang="ts">
import type { ProgressInfo } from 'electron-updater'

const props = defineProps<{
  downloadProgress: ProgressInfo | null
  updateDownloaded: boolean
}>()

const dialogVisible = defineModel<boolean>({ default: true })

const { downloadProgress, updateDownloaded } = toRefs(props)

function installUpdate() {
  window.api.installUpdate()
}

function cancelDownload() {
  window.api.cancelDownload()
  dialogVisible.value = false
}
</script>

<template>
  <MyDialog
    v-model="dialogVisible"
    :title="$t('update.downloadProgress')"
    width="460px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
  >
    <div>
      <div class="mb-2 text-default">
        {{ !updateDownloaded ? $t('update.downloading') : $t('update.downloaded') }}
      </div>
      <ElProgress :percentage="updateDownloaded ? 100 : downloadProgress?.percent" />
    </div>
    <template #footer>
      <ElButton v-if="!updateDownloaded" type="danger" @click="cancelDownload">
        {{ $t('update.cancel') }}
      </ElButton>
      <ElButton v-else type="primary" @click="installUpdate">
        {{ $t('update.install') }}
      </ElButton>
    </template>
  </MyDialog>
</template>
