<script setup lang="ts">
import type { ScriptSchema } from 'mqttx'

const currentCodec = ref<ScriptSchema['codec']>('protobuf')
const currentSchemaContent = ref<ScriptSchema['content']>('')
</script>

<template>
  <div>
    <ScriptSchemaEditor
      v-model:codec="currentCodec"
      v-model:content="currentSchemaContent"
    />
    <!-- <ScriptFunctionTest
      :current-lang="currentLang"
      :current-function-content="currentFunctionContent"
    /> -->
  </div>
</template>
