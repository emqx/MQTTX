<script lang="ts" setup>
import useMockData from '@/composables/useMockData'
import { useSettingsStore } from '@mqttx/ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const settingsStore = useSettingsStore()

const { connections } = useMockData()
const route = useRoute()
const activeId = computed(() => route.params.id)
</script>

<template>
  <div class="connections-container">
    <el-card class="connections-list">
      <el-select></el-select>
      <div>{{ $t('connections.newConnections') }}</div>
      <div>{{ $t('settings.language') }} {{ settingsStore.lang }}</div>
      <el-button type="primary" @click="settingsStore.changeLang('zh')">Change Lang to ZH</el-button>
      <connection-list-view :data="connections" :active-id="activeId" />
    </el-card>
    <el-card class="connection-detail">
      <router-view v-if="connections.length" />
      <empty-view v-else />
    </el-card>
  </div>
</template>
