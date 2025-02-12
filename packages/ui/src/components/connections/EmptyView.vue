<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import Banner from '../../assets/images/connections/empty/banner.svg'

const { empty } = useLinks()
</script>

<template>
  <ElScrollbar id="connections-empty-view" class="bg-primary select-none">
    <div class="min-h-screen p-6 flex flex-col items-center justify-center text-center">
      <img class="mb-5" :src="Banner" :alt="$t('connections.newConnections')" width="397" height="177">
      <ElButton
        class="mb-8"
        type="primary"
        size="large"
        :icon="Plus"
        @click="() => $router.push('/connections/create')"
      >
        {{ $t('connections.newConnections') }}
      </ElButton>
      <I18nT scope="global" keypath="common.emqx" tag="p" class="mb-4 text-default text-sm max-w-2xl">
        <template #emqx>
          <a
            class="text-main-green hover:underline"
            :href="empty.EMQX"
            target="_blank"
            rel="noopener"
          >
            EMQX
          </a>
        </template>
      </I18nT>
      <I18nT scope="global" keypath="common.cloud" tag="p" class="text-default text-sm max-w-2xl">
        <template #cloud>
          <a
            class="text-main-green hover:underline"
            :href="empty.EMQXCloud"
            target="_blank"
            rel="noopener"
          >
            EMQX Cloud
          </a>
        </template>
      </I18nT>
    </div>
  </ElScrollbar>
</template>
