import type { ScriptFunction } from 'mqttx'

export const useScriptFunctionStore = defineStore('script-function', () => {
  const scriptFunctions = ref<ScriptFunction[]>([])

  function updateScriptFunctions(newScriptFunctions: ScriptFunction[]) {
    scriptFunctions.value = newScriptFunctions
  }

  return { scriptFunctions, updateScriptFunctions }
})
