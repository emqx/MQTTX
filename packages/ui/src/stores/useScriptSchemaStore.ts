import type { ScriptSchema } from 'mqttx'

export const useScriptSchemaStore = defineStore('script-schema', () => {
  const scriptSchemas = ref<ScriptSchema[]>([])
  const protobufSchemas = computed(() => scriptSchemas.value.filter(item => item.codec === 'protobuf'))
  const avroSchemas = computed(() => scriptSchemas.value.filter(item => item.codec === 'avro'))

  function updateScriptSchemas(newScriptFunctions: ScriptSchema[]) {
    scriptSchemas.value = newScriptFunctions
  }

  return {
    scriptSchemas,
    protobufSchemas,
    avroSchemas,
    updateScriptSchemas,
  }
})
