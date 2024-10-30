<script lang="ts" setup>
import useMockData from '@/composables/useMockData'

const { connections } = useMockData()
</script>

<template>
  <split-view class="connections-container" min-size="180px" max-size="400px">
    <template #panel-1>
      <div class="connections-list">
        <connection-list-view :data="connections" />
      </div>
    </template>
    <template #panel-2>
      <div class="connection-detail">
        <router-view v-if="connections.length" />
        <empty-view v-else />
      </div>
    </template>
  </split-view>
</template>
