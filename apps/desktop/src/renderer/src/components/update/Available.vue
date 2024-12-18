<script setup lang="ts">
const props = defineProps<{
  version: string
  releaseNotes: string
}>()

const dialogVisible = defineModel<boolean>({ default: false })

const { version, releaseNotes } = toRefs(props)

function ignoreCurrentVersion() {
  localStorage.setItem('ignoreVersion', version.value)
  dialogVisible.value = false
}

function remindLater() {
  localStorage.removeItem('ignoreVersion')
  dialogVisible.value = false
}

function downloadUpdate() {
  window.api.downloadUpdate()
  dialogVisible.value = false
}

watch(releaseNotes, () => {
  nextTick(() => {
    const links = document.querySelectorAll('.prose a')
    links.forEach((link) => {
      link.setAttribute('target', '_blank')
    })
  })
})
</script>

<template>
  <MyDialog
    v-model="dialogVisible"
    :title="$t('update.updateTitle', { version })"
    width="min(100vw - 200px, 960px)"
  >
    <ElScrollbar class="h-[min(50vh,400px)]">
      <div class="prose prose-sm" v-html="releaseNotes" />
    </ElScrollbar>
    <template #footer>
      <div class="flex gap-6 justify-between">
        <ElButton @click="ignoreCurrentVersion">
          {{ $t('update.ignoreVersion') }}
        </ElButton>
        <div>
          <ElButton @click="remindLater">
            {{ $t('update.nextRemind') }}
          </ElButton>
          <ElButton type="primary" @click="downloadUpdate">
            {{ $t('update.update') }}
          </ElButton>
        </div>
      </div>
    </template>
  </MyDialog>
</template>
