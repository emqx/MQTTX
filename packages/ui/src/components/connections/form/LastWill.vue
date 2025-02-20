<script setup lang="ts">
import type { ConnectionForm } from 'mqttx'

const record = defineModel<ConnectionForm>({ required: true })

const isCollapse = ref(false)
</script>

<template>
  <div class="mb-8">
    <h2
      class="mb-2.5 text-sm text-light font-bold flex gap-2 items-center cursor-pointer"
      tabindex="0"
      role="button"
      @click="isCollapse = !isCollapse"
      @keydown.enter="isCollapse = !isCollapse"
    >
      {{ $t('connections.willMessage') }}
      <ElIconCaretRight :style="{ transform: isCollapse ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.3s' }" width="14" height="14" />
    </h2>
    <ElCollapseTransition>
      <ElCard v-show="!isCollapse" shadow="never">
        <ElRow :gutter="10">
          <ElCol :span="22">
            <ElFormItem label-width="164px" :label="$t('connections.connectionTimeout')" prop="connectTimeout">
              <ElInputNumber
                v-model="record.connectTimeout"
                type="number"
                :min="0"
                controls-position="right"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="2">
            <div class="mt-1.5 text-xs text-default">
              ({{ $t('common.unitS') }})
            </div>
          </ElCol>
        </ElRow>
      </ElCard>
    </ElCollapseTransition>
  </div>
</template>
