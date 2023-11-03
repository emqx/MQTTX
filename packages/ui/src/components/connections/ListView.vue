<script lang="ts" setup>
import type { Connection } from 'mqttx'

const props = defineProps<{
  data: Connection[]
  activeId: string
}>()

const isActive = (id: string): boolean => id === props.activeId
</script>

<template>
  <div class="connection-list-view p-4">
    <div class="list-header mb-3">
      <h1>{{ $t('connections.connections') }}</h1>
    </div>
    <ul v-if="data.length">
      <li v-for="{ id, name } in data" :key="id" class="flex items-center">
        <svg class="icon w-[24px] h-[24px] mr-2" aria-hidden="true">
          <use :xlink:href="isActive(id) ? '#icon-unfold' : '#icon-fold'"></use>
        </svg>
        <router-link
          :to="`/connections/${id}`"
          :class="['truncate overflow-hidden text-base', isActive(id) ? 'text-main-green' : '']"
        >
          {{ name }}
        </router-link>
      </li>
    </ul>
    <div v-else>No Data!</div>
  </div>
</template>
