<script setup lang="ts">
const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
}>(), {
  mode: 'create',
})

const { mode } = toRefs(props)
</script>

<template>
  <ElScrollbar id="connections-form-view" class="bg-primary min-h-full select-none">
    <ConnectionsFormHeader :mode="mode" />
  </ElScrollbar>
</template>
