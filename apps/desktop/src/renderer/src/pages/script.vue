<script setup lang="ts">
import useScriptFunctionService from '@database/services/ScriptFunctionService'

const { upsert, remove } = useScriptFunctionService()

provide('scriptFunctionUpsert', upsert)
provide('scriptFunctionRemove', remove)
</script>

<template>
  <ScriptView />
</template>
