<script setup lang="ts">
import type { ConnectionForm } from 'mqttx'

const record = defineModel<ConnectionForm>({ required: true })

const loading = ref(false)
const accept = ['crt', 'key', 'pem', 'jks', 'der', 'cer', 'pfx'].map(item => `.${item}`).join(',')

function handleUploadFile(type: 'ca' | 'cert' | 'key', file: { name: string, content: string }) {
  record.value[type].name = file.name
  record.value[type].content = file.content
}
</script>

<template>
  <div v-if="record.certType === 'self'" class="mb-8">
    <h2 class="mb-2.5 text-sm text-light font-bold">
      Certificates
    </h2>
    <ElCard v-loading="loading" shadow="never">
      <ElRow :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="164px" :label="$t('connections.ca')" prop="ca">
            <ElInput v-model.trim="record.ca.name" disabled />
          </ElFormItem>
        </ElCol>
        <ElCol :span="2">
          <MyUpload
            v-model:loading="loading"
            :accept="accept"
            @upload="file => handleUploadFile('ca', file)"
          >
            <ElButton link class="mt-1.5 hover:!text-main-green transition-colors">
              <ElIconFolderOpened width="14" height="14" />
            </ElButton>
          </MyUpload>
        </ElCol>
      </ElRow>
      <ElRow :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="164px" :label="$t('connections.cert')" prop="cert">
            <ElInput v-model.trim="record.cert.name" disabled />
          </ElFormItem>
        </ElCol>
        <ElCol :span="2">
          <MyUpload
            v-model:loading="loading"
            :accept="accept"
            @upload="file => handleUploadFile('cert', file)"
          >
            <ElButton link class="mt-1.5 hover:!text-main-green transition-colors">
              <ElIconFolderOpened width="14" height="14" />
            </ElButton>
          </MyUpload>
        </ElCol>
      </ElRow>
      <ElRow :gutter="10">
        <ElCol :span="22">
          <ElFormItem label-width="164px" :label="$t('connections.key')" prop="key">
            <ElInput v-model.trim="record.key.name" disabled />
          </ElFormItem>
        </ElCol>
        <ElCol :span="2">
          <MyUpload
            v-model:loading="loading"
            :accept="accept"
            @upload="file => handleUploadFile('key', file)"
          >
            <ElButton link class="mt-1.5 hover:!text-main-green transition-colors">
              <ElIconFolderOpened width="14" height="14" />
            </ElButton>
          </MyUpload>
        </ElCol>
      </ElRow>
    </ElCard>
  </div>
</template>
