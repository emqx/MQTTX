<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = computed(() => route.name === '/connections/[id]' && route.params.id)
</script>

<template>
  <connection-details-view
    :connection="{
      name: 'test',
      id,
    }"
  />
</template>
