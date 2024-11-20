<script setup lang="ts">
import useSettingsService from '@/database/services/SettingsService'

const { settings } = useSettingsService()
</script>

<template>
  <SettingsView v-model="settings" />
</template>
