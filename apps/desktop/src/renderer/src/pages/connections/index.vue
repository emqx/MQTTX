<script lang="ts" setup>
import useMockData from '@/composables/useMockData'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { connections } = useMockData()
const route = useRoute()
const activeId = computed(() => route.params.id)
</script>

<template>
  <split-view class="connections-container" min-size="180px" max-size="400px">
    <template #panel-1>
      <div class="connections-list">
        <connection-list-view :data="connections" :active-id="activeId" />
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
