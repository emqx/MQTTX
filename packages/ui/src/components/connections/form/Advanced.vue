<script setup lang="ts">
import type { ConnectionForm } from 'mqttx'

const record = defineModel<ConnectionForm>({ required: true })

const isCollapse = ref(false)

const protocolVersionOptions = [
  { label: '3.1', value: 3 },
  { label: '3.1.1', value: 4 },
  { label: '5.0', value: 5 },
]

function handleCleanChange(value: string | number | boolean) {
  if (record.value.protocolVersion !== 5) return

  if (value) {
    record.value.properties.sessionExpiryInterval = 0
  } else {
    record.value.properties.sessionExpiryInterval = 7200
  }
}
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
      {{ $t('settings.advanced') }}
      <ElIconCaretRight :style="{ transform: isCollapse ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.3s' }" width="14" height="14" />
    </h2>
    <ElCollapseTransition>
      <div v-show="!isCollapse">
        <ElCard shadow="never">
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" :label="$t('connections.mqttVersion')">
                <ElSelect v-model="record.protocolVersion">
                  <ElOption v-for="{ label, value } in protocolVersionOptions" :key="value" :label="label" :value="value" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" :label="$t('connections.connectionTimeout')">
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
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" label="Keep Alive">
                <ElInputNumber
                  v-model="record.keepalive"
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
              <ElFormItem label-width="180px" :label="$t('connections.autoReconnect')">
                <ElSwitch v-model="record.reconnect" />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow v-if="record.reconnect" :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" :label="$t('connections.reconnectPeriod')">
                <ElInputNumber
                  v-model="record.reconnectPeriod"
                  type="number"
                  :min="1"
                  controls-position="right"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="2">
              <div class="mt-1.5 text-xs text-default">
                ({{ $t('common.unitMS') }})
              </div>
            </ElCol>
          </ElRow>
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ElFormItem label-width="180px" :label="record.protocolVersion === 5 ? 'Clean Start' : 'Clean Session'">
                <ElSwitch v-model="record.clean" @change="handleCleanChange" />
              </ElFormItem>
            </ElCol>
          </ElRow>

          <template v-if="record.protocolVersion === 5">
            <ElRow :gutter="10">
              <ElCol :span="22">
                <ElFormItem label-width="180px" :label="$t('connections.sessionExpiryInterval')">
                  <ElInputNumber
                    v-model="record.properties.sessionExpiryInterval"
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
                <ElFormItem label-width="180px" :label="$t('connections.receiveMaximum')">
                  <ElInputNumber
                    v-model="record.properties.receiveMaximum"
                    type="number"
                    :min="1"
                    controls-position="right"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="10">
              <ElCol :span="22">
                <ElFormItem label-width="180px" :label="$t('connections.maximumPacketSize')">
                  <ElInputNumber
                    v-model="record.properties.maximumPacketSize"
                    type="number"
                    :min="100"
                    controls-position="right"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="10">
              <ElCol :span="22">
                <ElFormItem label-width="180px" :label="$t('connections.topicAliasMaximum')">
                  <ElInputNumber
                    v-model="record.properties.topicAliasMaximum"
                    type="number"
                    :min="1"
                    controls-position="right"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="10">
              <ElCol :span="22">
                <ElFormItem label-width="180px" :label="$t('connections.requestResponseInformation')">
                  <ElSwitch v-model="record.properties.requestResponseInformation" />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="10">
              <ElCol :span="22">
                <ElFormItem label-width="180px" :label="$t('connections.requestProblemInformation')">
                  <ElSwitch v-model="record.properties.requestProblemInformation" />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </template>
        </ElCard>

        <ElCard v-if="record.protocolVersion === 5" class="mt-8" shadow="never">
          <ElRow :gutter="10">
            <ElCol :span="22">
              <ConnectionsFormUserProperties
                v-model="record.properties.userProperties"
                :title="$t('connections.userProperties')"
              />
            </ElCol>
          </ElRow>
        </ElCard>
      </div>
    </ElCollapseTransition>
  </div>
</template>
