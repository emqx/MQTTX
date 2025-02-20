<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { getDefaultConnectionFormRecord } from '@mqttx/core'

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
}>(), {
  mode: 'create',
})

const { mode } = toRefs(props)

const formRef = ref<FormInstance | null>(null)

const record = reactive(getDefaultConnectionFormRecord())
</script>

<template>
  <div id="connections-form-view" class="h-screen select-none">
    <ConnectionsFormHeader :mode="mode" />
    <ElScrollbar class="bg-primary h-[calc(100%-56px)]">
      <ElForm
        ref="formRef"
        class="p-5"
        :model="record"
        novalidate
        @submit.prevent
      >
        <ConnectionsFormGeneral v-model="record" :mode="mode" />
        <ConnectionsFormCertificates v-model="record" />
        <ConnectionsFormAdvanced v-model="record" />
        <ConnectionsFormLastWill v-model="record" />
      </ElForm>
    </ElScrollbar>
  </div>
</template>

<style lang="scss">
#connections-form-view {
  --el-input-height: 28px;
  --el-disabled-bg-color: transparent;
  .el-input-number {
    @apply w-full;
    .el-input__inner {
      @apply text-left;
    }
  }
}
</style>
