<script lang="ts" setup>
const route = useRoute()
const router = useRouter()
const id = computed(() => (route.name === '/connections/[id]' && route.params.id).toString())
</script>

<template>
  TODO: Connection Details View
  <ElButton @click="router.push({ name: '/connections/[id].edit', params: { id } })">
    Edit {{ `/connections/${id}/edit` }}
  </ElButton>
  <!-- <ConnectionsDetailsView
    :connection="{
      name: 'test',
      id,
    }"
  /> -->
</template>
