<script setup lang="ts">
import { useScriptFunctionService, useScriptSchemaService } from '@database/services'

const { upsert: functionUpsert, remove: functionRemove } = useScriptFunctionService()

provide('scriptFunctionUpsert', functionUpsert)
provide('scriptFunctionRemove', functionRemove)

const { upsert: schemaUpsert, remove: schemaRemove } = useScriptSchemaService()

provide('scriptSchemaUpsert', schemaUpsert)
provide('scriptSchemaRemove', schemaRemove)
</script>

<template>
  <ScriptView />
</template>
