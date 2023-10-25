<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  connection: {
    id: string
    name: string
    host: string
    port: number
    username: string
    lastConnected: string
    topics: string[]
  }
}>()
</script>

<template>
  <div class="connection-details-view text-base">
    <p>Connection ID: {{ connection.id }}</p>
    <p>Name: {{ connection.name }}</p>
    <p>Host: {{ connection.host }}</p>
    <p>Port: {{ connection.port }}</p>
    <p>Username: {{ connection.username }}</p>
    <p>Last Connected: {{ connection.lastConnected }}</p>
    <ul>
      <li v-for="topic in connection.topics" :key="topic">{{ topic }}</li>
    </ul>
  </div>
</template>
