<script lang="ts" setup>
import type { Connection } from 'mqttx'
import { useConnectionsStore } from '../../stores'

defineProps<{
  data: Connection[]
  activeId: string
}>()

const connStore = useConnectionsStore()
</script>

<template>
  <div class="connection-list-view">
    {{ connStore.count }}
    <ul v-if="data.length">
      <li v-for="{ id, name } in data" :key="id">
        <router-link :to="`/connections/${id}`" :class="[activeId === id ? 'text-green-primary' : '', 'text-base']">
          {{ name }}
        </router-link>
      </li>
    </ul>
    <div v-else>No Data!</div>
  </div>
</template>
