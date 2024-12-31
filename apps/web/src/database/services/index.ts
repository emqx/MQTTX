import useScriptFunctionService from './ScriptFunctionService'
import useSettingsService from './SettingsService'

/**
 * Initializes all table data and subscribes to data changes.
 */
async function initTables() {
  await Promise.all([
    useScriptFunctionService().init(),
    useSettingsService().init(),
  ])
}

export {
  initTables,
  useScriptFunctionService,
  useSettingsService,
}
