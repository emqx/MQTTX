<script lang="ts" setup>
import useMockData from '@/composables/useMockData'

const { connections } = useMockData()
</script>

<template>
  <CommonSplitView class="connections-container" min-size="180px" max-size="400px">
    <template #panel-1>
      <div class="connections-list">
        <ConnectionsListView :data="connections" />
      </div>
    </template>
    <template #panel-2>
      <div class="connection-detail">
        <RouterView v-if="connections.length" />
        <CommonEmptyView v-else />
      </div>
    </template>
  </CommonSplitView>
</template>
