<script setup lang="ts">
import type { ScriptFunction } from 'mqttx'

const currentLang = ref<ScriptFunction['lang']>('javascript')
const currentFunctionContent = ref<ScriptFunction['content']>('')
</script>

<template>
  <div>
    <ScriptFunctionEditor
      v-model:lang="currentLang"
      v-model:content="currentFunctionContent"
    />
    <ScriptFunctionTest
      :current-lang="currentLang"
      :current-function-content="currentFunctionContent"
    />
  </div>
</template>
