<script setup lang="ts">
const props = defineProps<{
  version: string
}>()

const dialogVisible = defineModel<boolean>({ default: false })

const { version } = toRefs(props)

function ignoreCurrentVersion() {
  localStorage.setItem('ignoreVersion', version.value)
  dialogVisible.value = false
}

function remindLater() {
  localStorage.removeItem('ignoreVersion')
  dialogVisible.value = false
}

function downloadUpdate() {
  // TODO: download update
  // window.api.downloadUpdate()
  dialogVisible.value = false
}
</script>

<template>
  <MyDialog
    v-model="dialogVisible"
    :title="$t('update.updateTitle')"
    width="min(100vw - 80px, 960px)"
  >
    <div>
      TODO: release notes
    </div>
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
