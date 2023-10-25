<script lang="ts" setup>
import useMockData from '@/composables/useMockData'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { connections } = useMockData()
const route = useRoute()
const activeId = computed(() => route.params.id)
</script>

<template>
  <div class="connections-container">
    <div class="connections-list">
      <connection-list-view :data="connections" :active-id="activeId" />
    </div>
    <div class="connection-detail">
      <router-view v-if="connections.length" />
      <empty-view v-else />
    </div>
  </div>
</template>
