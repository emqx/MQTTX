<script setup lang="ts">
import type { ConnectionDetail } from 'mqttx'
import { ref } from 'vue'
import SplitView from '../common/SplitView.vue'

defineProps<{
  connection: ConnectionDetail
}>()

const payload = ref(
  JSON.stringify(
    {
      msg: 'hello',
    },
    null,
    2,
  ),
)
</script>

<template>
  <div class="connection-details-view text-base h-full">
    <split-view vertical fixed-panel-size="180px" max-size="500px" min-size="180px" handle-color="bg-border-default">
      <template #panel-1>
        <div class="p-4">
          <p>Connection ID: {{ connection.id }}</p>
          <p>Name: {{ connection.name }}</p>
          <p>Host: {{ connection.host }}</p>
          <p>Port: {{ connection.port }}</p>
          <p>Username: {{ connection.username }}</p>
          <p>Last Connected: {{ connection.lastConnected }}</p>
          <ul class="ml-12">
            <li v-for="topic in connection.topics" :key="topic">{{ topic }}</li>
          </ul>
        </div>
      </template>
      <template #panel-2>
        <div class="p-4">
          <el-input v-model="payload" type="textarea" :rows="4"></el-input>
        </div>
      </template>
    </split-view>
  </div>
</template>
