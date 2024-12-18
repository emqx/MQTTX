<script setup lang="ts">
import Logo from '../../../../../../../packages/ui/src/assets/images/logo.png'

const dialogVisible = defineModel<boolean>({ default: false })

const version = ref(`v${window.__APP_VERSION__}`)
</script>

<template>
  <MyDialog
    v-model="dialogVisible"
    width="280px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
  >
    <div class="text-center select-none">
      <img class="mx-auto mb-6" :src="Logo" alt="MQTTX" width="64" height="64">
      <div class="mb-0.5 text-title font-semibold text-2xl">
        MQTTX
      </div>
      <div class="mb-6 text-default text-sm">
        {{ version }}
      </div>
      <div class="text-default">
        {{ $t('update.noUpdateAvailable') }}
      </div>
    </div>
    <template #footer>
      <ElButton class="w-full" type="primary" @click="dialogVisible = false">
        {{ $t('common.close') }}
      </ElButton>
    </template>
  </MyDialog>
</template>
