<script lang="ts" setup>
// Desktop Data Fetch
defineProps<{
  id: string
}>()
</script>

<template>
  <connection-details-view
    :connection="{
      name: 'test',
      id,
    }"
  />
</template>
