<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { ConnectionForm } from 'mqttx'

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
}>(), {
  mode: 'create',
})

const { mode } = toRefs(props)

const formRef = ref<FormInstance | null>(null)

const record = reactive<ConnectionForm>({
  // TODO: implement record
  name: '',
  protocol: 'mqtt',
  host: 'broker.emqx.io',
  port: 1883,
  clientId: '',
  clientIdWithTime: false,
  path: '',
  username: '',
  password: '',
  ssl: false,
  rejectUnauthorized: true,
  ALPNProtocols: '',
  certType: 'server',
  ca: {
    name: '',
    content: '',
  },
  cert: {
    name: '',
    content: '',
  },
  key: {
    name: '',
    content: '',
  },
  protocolVersion: 5,
  connectTimeout: 10,
  keepalive: 60,
  reconnect: true,
  reconnectPeriod: 4000,
  clean: true,
  properties: {
    sessionExpiryInterval: 0,
    receiveMaximum: undefined,
    maximumPacketSize: undefined,
    topicAliasMaximum: undefined,
    requestResponseInformation: undefined,
    requestProblemInformation: undefined,
    userProperties: undefined,
    authenticationMethod: undefined,
    authenticationData: undefined,
  },
})
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
