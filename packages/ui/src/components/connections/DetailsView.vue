<script setup lang="ts">
import type { ConnectionDetail } from 'mqttx'
// import { ref } from 'vue'
import SplitView from '../common/SplitView.vue'

defineProps<{
  connection: ConnectionDetail
}>()

// const payload = ref(
//   JSON.stringify(
//     {
//       msg: 'hello',
//     },
//     null,
//     2,
//   ),
// )
</script>

<template>
  <div class="connection-details-view text-base h-full">
    <split-view vertical fixed-panel-size="180px" max-size="500px" min-size="180px" handle-color="bg-border-default">
      <template #panel-1> </template>
      <template #panel-2> </template>
    </split-view>
  </div>
</template>
