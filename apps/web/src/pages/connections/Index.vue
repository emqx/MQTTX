<script lang="ts" setup>
import useMockData from '@/composables/useMockData'

const { connections } = useMockData()
</script>

<template>
  <div class="connections-container">
    <div class="connections-list">
      <connection-list-view :data="connections" />
    </div>
    <div class="connection-detail">
      <router-view v-if="connections.length" />
      <empty-view v-else />
    </div>
  </div>
</template>
