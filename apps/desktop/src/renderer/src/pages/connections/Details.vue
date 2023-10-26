<script lang="ts" setup>
// Desktop Data Fetch
import { ref, watch } from 'vue'
import useMockData from '@/composables/useMockData'
import { useConnectionsStore } from '@mqttx/ui'

const props = defineProps<{
  id: string
}>()

const connStore = useConnectionsStore()
const { getMockConnectionDetail } = useMockData()
const selectedConnection = ref({})
const loadDetails = (id: string): void => {
  selectedConnection.value = getMockConnectionDetail(id)
}
loadDetails(props.id)
watch(
  () => props.id,
  (newId) => {
    loadDetails(newId)
  },
  { immediate: true },
)
</script>

<template>
  {{ connStore.count }}
  <connection-details-view :connection="selectedConnection" />
</template>
