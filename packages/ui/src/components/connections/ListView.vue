<script lang="ts" setup>
import { Connection } from 'mqttx'

defineProps<{
  data: Connection[]
}>()
</script>

<template>
  <div class="connection-list-view">
    <ul v-if="data.length">
      <li v-for="{ id, name } in data" :key="id">
        <router-link :to="`/connections/${id}`" class="text-green-primary text-base"> {{ name }} </router-link>
      </li>
    </ul>
    <div v-else>No Data!</div>
  </div>
</template>
