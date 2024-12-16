<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    width?: string
    cancelText?: string
    confirmText?: string
    cancelVisible?: boolean
    confirmVisible?: boolean
  }>(),
  {
    title: '',
    width: '560px',
    cancelVisible: true,
    confirmVisible: true,
  },
)

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'close'): void
  (e: 'enter'): void
  (e: 'confirm'): void
}>()

const dialogVisible = defineModel<boolean>({ default: false })
const confirmLoading = defineModel<boolean>('confirmLoading', { default: false })
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    @open="() => emit('open')"
    @close="() => emit('close')"
    @keyup.enter="() => emit('enter')"
  >
    <slot />
    <template #footer>
      <slot name="footer">
        <div>
          <el-button
            v-if="cancelVisible"
            text
            type="default"
            @click="dialogVisible = false"
          >
            {{ cancelText ?? $t('common.cancel') }}
          </el-button>
          <el-button
            v-if="confirmVisible"
            text
            type="primary"
            :loading="confirmLoading"
            @click="() => emit('confirm')"
          >
            {{ confirmText ?? $t('common.confirm') }}
          </el-button>
        </div>
      </slot>
    </template>
  </ElDialog>
</template>
