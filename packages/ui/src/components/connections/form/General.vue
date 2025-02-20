<script setup lang="ts">
import type { AutocompleteFetchSuggestions, FormItemRule } from 'element-plus'
import type { Arrayable } from 'element-plus/es/utils/index.mjs'
import type { ConnectionForm, PlatformType } from 'mqttx'
import { getClientId } from '@mqttx/core'

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
}>(), {
  mode: 'create',
})

const record = defineModel<ConnectionForm>({ required: true })

const { mode } = toRefs(props)

const platformType = inject<PlatformType>('platformType', 'web')

const { t } = useI18n()
const nameRules = computed<Arrayable<FormItemRule>>(() => [
  { required: true, message: t('common.inputRequired') },
  {
    trigger: 'blur',
    validator: (rule, value, cb) => {
    // TODO: implement nameRules
      console.log(rule, value, cb)
      cb()
    },
  },
])
const requiredRules = computed<Arrayable<FormItemRule>>(() => [
  { required: true, message: t('common.inputRequired') },
])

const querySearchName: AutocompleteFetchSuggestions = (query, cb) => {
  // TODO: implement querySearchName
  console.log(query, cb)
}

function handleSelectName(item: Record<string, any>) {
  // TODO: implement handleSelectName
  console.log(item)
}

const protocolOptions = ['mqtt', 'mqtts', 'ws', 'wss']

function handleProtocolChange(value: string) {
  // TODO: implement handleProtocolChange
  console.log(value)
}

function handleSslChange(value: string | number | boolean) {
  // TODO: implement handleSslChange
  console.log(value)
}

const ALPNProtocolsOptions = ref<string[]>([
  'mqtt',
  'x-amzn-mqtt-ca',
  'x-amzn-http-ca',
])

const certTypeOptions: { label: string, value: ConnectionForm['certType'] }[] = [
  { label: 'CA signed server certificate', value: 'server' },
  { label: 'CA or Self signed certificates', value: 'self' },
]
</script>

<template>
  <div class="mb-8">
    <h2 class="mb-2.5 text-sm text-light font-bold">
      {{ $t('settings.general') }}
    </h2>
    <ElCard shadow="never">
      <ElRow :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="96px" :label="$t('connections.name')" prop="name" :rules="nameRules">
            <ElAutocomplete
              v-if="mode === 'create'"
              v-model.trim="record.name"
              value-key="name"
              :fetch-suggestions="querySearchName"
              @select="handleSelectName"
            />
            <ElInput v-else v-model.trim="record.name" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="2">
          <ElTooltip
            v-if="mode === 'create'"
            popper-class="max-w-[420px]"
            placement="top"
            :open-delay="500"
            :content="$t('connections.nameTip')"
          >
            <ElButton link class="mt-1.5 hover:!text-main-green transition-colors">
              <ElIconWarning width="14" height="14" />
            </ElButton>
          </ElTooltip>
        </ElCol>
      </ElRow>
      <ElRow :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="96px" :label="$t('connections.brokerIP')" prop="host" :rules="requiredRules">
            <ElRow class="!w-full">
              <ElCol :span="6" class="pr-2.5">
                <ElSelect v-model="record.protocol" @change="handleProtocolChange">
                  <ElOption v-for="item in protocolOptions" :key="item" :label="`${item}://`" :value="item" />
                </ElSelect>
              </ElCol>
              <ElCol :span="18">
                <ElInput v-model.trim="record.host" />
              </ElCol>
            </ElRow>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="96px" :label="$t('connections.brokerPort')" prop="port" :rules="requiredRules">
            <ElInputNumber
              v-model="record.port"
              type="number"
              :min="0"
              :max="65535"
              controls-position="right"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="96px" label="Client ID" prop="clientId">
            <ElInput v-model="record.clientId" clearable />
          </ElFormItem>
        </ElCol>
        <ElCol :span="1">
          <ElButton
            link
            class="mt-1.5 hover:!text-main-green transition-colors"
            @click="() => (record.clientId = getClientId())"
          >
            <ElIconRefreshRight width="14" height="14" />
          </ElButton>
        </ElCol>
        <ElCol :span="1">
          <ElTooltip
            v-if="mode === 'create'"
            popper-class="max-w-[420px]"
            placement="top"
            :open-delay="500"
            :content="$t('connections.clientIdWithTimeTip')"
          >
            <ElButton
              link
              class="mt-1.5 transition-colors"
              :class="{ '!text-main-green': record.clientIdWithTime }"
              @click="() => (record.clientIdWithTime = !record.clientIdWithTime)"
            >
              <ElIconTimer width="14" height="14" />
            </ElButton>
          </ElTooltip>
        </ElCol>
      </ElRow>
      <ElRow v-if="['ws', 'wss'].includes(record.protocol)" :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="96px" label="Path" prop="path" :rules="requiredRules">
            <ElInput v-model.trim="record.path" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="96px" :label="$t('connections.username')" prop="username">
            <ElInput v-model.trim="record.username" clearable />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="96px" :label="$t('connections.password')" prop="password">
            <ElInput v-model.trim="record.password" type="password" show-password clearable />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="96px" label="SSL/TLS" prop="ssl">
            <ElSwitch v-model="record.ssl" @change="handleSslChange" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <template v-if="record.ssl">
        <ElRow :gutter="10">
          <ElCol :span="22">
            <ElFormItem label-width="96px" :label="$t('connections.strictValidateCertificate')" prop="rejectUnauthorized">
              <ElSwitch v-model="record.rejectUnauthorized" />
              <ElTooltip
                popper-class="max-w-[420px]"
                placement="top"
                :open-delay="500"
                :content="$t('connections.secureTip')"
              >
                <ElButton link class="ml-2 hover:!text-main-green transition-colors">
                  <ElIconWarning width="14" height="14" />
                </ElButton>
              </ElTooltip>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="10">
          <ElCol :span="22">
            <ElFormItem label-width="96px" label="ALPN" prop="ALPNProtocols">
              <ElSelect
                v-model="record.ALPNProtocols"
                multiple
                filterable
                default-first-option
                allow-create
              >
                <ElOption
                  v-for="item in ALPNProtocolsOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow v-if="platformType === 'desktop'" :gutter="10">
          <ElCol :span="22">
            <ElFormItem label-width="96px" :label="$t('connections.certType')" prop="certType">
              <ElRadioGroup v-model="record.certType">
                <ElRadio v-for="{ label, value } in certTypeOptions" :key="value" :value="value">
                  {{ label }}
                </ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>
    </ElCard>
  </div>
</template>
