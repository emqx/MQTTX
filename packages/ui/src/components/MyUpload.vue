<script setup lang="ts">
import type { UploadFile, UploadUserFile } from 'element-plus'

defineProps<{
  accept: string
}>()

const emit = defineEmits<{
  (e: 'upload', file: { name: string, content: string }): void
}>()

const loading = defineModel<boolean>('loading', { default: false })

const fileList = ref<UploadUserFile[]>([])

function handleFileRead(file: File) {
  if (!file) return
  loading.value = true

  const reader = new FileReader()
  reader.onload = (e) => {
    if (typeof e.target?.result === 'string') {
      emit('upload', { name: file.name, content: e.target.result })
    }
    loading.value = false
  }
  reader.onerror = () => {
    loading.value = false
  }
  reader.readAsText(file)
}

function handleFileExceed(files: File[]) {
  handleFileRead(files[0])
}

function handleFileChange(uploadFile: UploadFile) {
  handleFileRead(uploadFile.raw!)
}
</script>

<template>
  <ElUpload
    v-model:file-list="fileList"
    :show-file-list="false"
    :auto-upload="false"
    :limit="1"
    :accept="accept"
    @exceed="handleFileExceed"
    @change="handleFileChange"
  >
    <slot />
  </ElUpload>
</template>
