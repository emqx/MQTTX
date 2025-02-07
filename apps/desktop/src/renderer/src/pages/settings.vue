<script setup lang="ts">
import useSettingsService from '@database/services/SettingsService'
import { useCLIInstall } from '../components/cli/useCLIInstall'

const { settings } = useSettingsService()

const { intallCliBtnLoading, installCli } = useCLIInstall()
</script>

<template>
  <SettingsView
    v-model="settings"
    :install-cli-btn-loading="intallCliBtnLoading"
    @install-cli="installCli"
  />
</template>
