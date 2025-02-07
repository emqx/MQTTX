<script setup lang="ts">
const props = defineProps<{
  percent: number | null
  updateDownloaded: boolean
}>()

const dialogVisible = defineModel<boolean>({ default: true })

const { percent, updateDownloaded } = toRefs(props)
</script>

<template>
  <MyDialog
    v-model="dialogVisible"
    :title="$t('settings.downloadingCLI')"
    width="460px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
  >
    <div>
      <ElProgress :percentage="updateDownloaded ? 100 : percent || 0" />
    </div>
    <template #footer>
      <div />
    </template>
  </MyDialog>
</template>
