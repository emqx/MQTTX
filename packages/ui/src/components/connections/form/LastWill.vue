<script setup lang="ts">
import type { ConnectionForm } from 'mqttx'
// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'

const record = defineModel<ConnectionForm>({ required: true })

const isCollapse = ref(false)

const { payloadTypeList, payloadType, payloadString, monacoEditorLangugage } = usePayloadConverter()

payloadString.value = record.value.will.payload.toString()

watch(payloadString, () => {
  record.value.will.payload = Buffer.from(payloadString.value)
})

const correlationDataString = ref(record.value.will.properties.correlationData?.toString() ?? '')

watch(correlationDataString, () => {
  record.value.will.properties.correlationData = Buffer.from(correlationDataString.value)
})
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
            <ElFormItem label-width="180px" :label="$t('connections.willTopic')">
              <ElInput v-model.trim="record.will.topic" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="10">
          <ElCol :span="22">
            <ElFormItem label-width="180px" :label="$t('connections.willQos')">
              <ElRadioGroup v-model="record.will.qos">
                <ElRadio v-for="item in [0, 1, 2]" :key="item" :value="item">
                  {{ item }}
                </ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="10">
          <ElCol :span="22">
            <ElFormItem label-width="180px" :label="$t('connections.willRetain')">
              <ElSwitch v-model="record.will.retain" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="10">
          <ElCol :span="22">
            <ElFormItem label-width="180px" :label="$t('connections.willPayload')">
              <div class="w-full">
                <section class="h-40 bg-normal border border-b-0 px-0.5 pb-0.5 pt-3 border-border-default rounded-t">
                  <MonacoEditor
                    :value="payloadString"
                    :language="monacoEditorLangugage"
                    :options="{ lineNumbers: 'on' }"
                    @update="payloadString = $event"
                  />
                </section>
                <div class="px-3 text-right bg-select-lang border border-t-0 border-border-default rounded-b">
                  <ElRadioGroup v-model="payloadType">
                    <ElRadio v-for="item in payloadTypeList" :key="item" :value="item">
                      {{ item }}
                    </ElRadio>
                  </ElRadioGroup>
                </div>
              </div>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <template v-if="record.protocolVersion === 5">
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" :label="$t('connections.payloadFormatIndicator')">
                <ElSwitch v-model="record.will.properties.payloadFormatIndicator" />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" :label="$t('connections.willDelayInterval')">
                <ElInputNumber
                  v-model="record.will.properties.willDelayInterval"
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
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" :label="$t('connections.messageExpiryInterval')">
                <ElInputNumber
                  v-model="record.will.properties.messageExpiryInterval"
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
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" :label="$t('connections.contentType')">
                <ElInput v-model="record.will.properties.contentType" />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" :label="$t('connections.responseTopic')">
                <ElInput v-model.trim="record.will.properties.responseTopic" />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" :label="$t('connections.correlationData')">
                <ElInput v-model="correlationDataString" />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow class="mb-[18px]" :gutter="10">
            <ElCol :span="22">
              <ConnectionsFormUserProperties
                v-model="record.will.properties.userProperties"
                layout="horizontal"
              >
                <template #title>
                  <div class="text-default text-right leading-[31px] w-[168px]">
                    {{ $t('connections.userProperties') }}
                  </div>
                </template>
              </ConnectionsFormUserProperties>
            </ElCol>
          </ElRow>
        </template>
      </ElCard>
    </ElCollapseTransition>
  </div>
</template>
