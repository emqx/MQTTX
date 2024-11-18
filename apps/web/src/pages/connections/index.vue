<script lang="ts" setup>
const { connections } = useMockData()
</script>

<template>
  <CommonSplitView class="connections-container" min-size="180px" max-size="400px">
    <template #panel-1>
      <div class="connections-list h-full shadow shadow-shadow-leftlist">
        <ConnectionsListView :data="connections" />
      </div>
    </template>
    <template #panel-2>
      <div class="connection-detail h-full">
        <RouterView v-if="connections.length" />
        <CommonEmptyView v-else />
      </div>
    </template>
  </CommonSplitView>
</template>
