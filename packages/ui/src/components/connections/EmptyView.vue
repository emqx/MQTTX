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
      <I18nT scope="global" keypath="connections.emptyDescription1" tag="p" class="mb-2 text-default text-sm max-w-2xl">
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
      <p class="text-default text-sm max-w-2xl">
        {{ $t('connections.emptyDescription2') }}
      </p>
    </div>
  </ElScrollbar>
</template>
