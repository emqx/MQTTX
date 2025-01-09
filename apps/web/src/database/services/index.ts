import useScriptFunctionService from './ScriptFunctionService'
import useScriptSchemaService from './ScriptSchemaService'
import useSettingsService from './SettingsService'

/**
 * Initializes all table data and subscribes to data changes.
 */
async function initTables() {
  await Promise.all([
    useScriptFunctionService().init(),
    useScriptSchemaService().init(),
    useSettingsService().init(),
  ])
}

export {
  initTables,
  useScriptFunctionService,
  useScriptSchemaService,
  useSettingsService,
}
