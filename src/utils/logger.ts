import { configure, getLogger, Logger } from 'log4js'
import { app, remote } from 'electron'
import fs from 'fs-extra'

/**
 * Get a logger above the specified level with scope.
 * @param scope - the scope of module, you should describe it semantically.
 * @param level - the level of log getter, logger will only display logs larger than this level.
 */
export const getlogger = (scope: string, level: string): Logger => {
  const LOG_PATH = getOrCreateLogDir()
  // all < trace < debug < info < warn < error < fatal < mark < off
  configure({
    appenders: {
      fileOutput: {
        type: 'file',
        filename: `${LOG_PATH}/log`,
        pattern: 'yyyy-MM-dd-hh.log',
        alwaysIncludePattern: true,
        maxLogSize: 10485760,
      },
      consoleOutput: {
        type: 'console',
      },
    },
    categories: {
      default: {
        appenders: ['fileOutput', 'consoleOutput'],
        // only output greater than debug level. such as info/warn
        // set to all if you want to print all level logger
        level: 'debug',
      },
    },
  })
  const newLogger = getLogger(scope)
  newLogger.level = level
  return newLogger
}

export const getOrCreateLogDir = () => {
  const isRenderer: boolean = process.type === 'renderer'
  // Render process use remote app
  const APP: Electron.App = isRenderer ? remote.app : app

  const STORE_PATH: string = APP.getPath('userData')
  const LOG_PATH: string = `${STORE_PATH}/logs`

  // In production mode, during the first open application
  // APP.getPath('userData') gets the path nested.
  // if it doesn't exist, create it.
  if (!isRenderer && !fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }

  // create dir APP_STORE_PATH/logs if it doesn't exist.
  if (!fs.pathExistsSync(LOG_PATH)) {
    fs.mkdirSync(LOG_PATH)
  }
  return LOG_PATH
}
