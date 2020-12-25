import log4js from 'log4js'
import { app, remote } from 'electron'
import fs from 'fs-extra'

/**
 * Get a logger above the specified level with scope.
 * @param scope - the scope of module, you should describe it semantically.
 * @param level - the level of log getter, logger will only display logs larger than this level.
 */
export const getlogger = (scope: string, level: string): log4js.Logger => {
  const LOG_DIR = getOrCreateLogDir()
  // all < trace < debug < info < warn < error < fatal < mark < off
  log4js.configure({
    appenders: {
      fileOutput: {
        type: 'file',
        filename: `${LOG_DIR}/log`,
        // pattern: 'yyyy-MM-dd-hh.log',
        alwaysIncludePattern: true,
        maxLogSize: 10485760,
      },
      consoleOutput: {
        type: 'stdout',
      },
    },
    categories: {
      default: {
        appenders: ['fileOutput', 'consoleOutput'],
        // only output greater than debug level. such as info/warn
        // set to all if you want to print all level logger
        level: 'debug',
        enableCallStack: true,
      },
    },
  })
  const newLogger = log4js.getLogger(scope)
  newLogger.level = level
  return newLogger
}

export const getOrCreateLogDir = () => {
  const isRenderer: boolean = process.type === 'renderer'
  // Render process use remote app
  const APP: Electron.App = isRenderer ? remote.app : app

  const STORE_PATH: string = APP.getPath('userData')
  const LOG_DIR: string = `${STORE_PATH}/logs`

  // In production mode, during the first open application
  // APP.getPath('userData') gets the path nested.
  // if it doesn't exist, create it.
  if (!isRenderer && !fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }

  // create dir APP_STORE_PATH/logs if it doesn't exist.
  if (!fs.pathExistsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR)
  }
  return LOG_DIR
}

/**
 *  quit all log appender and rename current logfile to yy-mm-dd-hh-mm.log
 */
export const quitAndRenameLogger = () => {
  // when APP quit, shutdown all appender
  log4js.shutdown()

  const LOG_DIR = getOrCreateLogDir()
  // YYYY-MM-DD-hh-mm
  const curDate = new Date().toISOString().slice(0, 16)
  // rename current log to yy-mm-dd-hh-mm.log
  fs.renameSync(`${LOG_DIR}/log`, `${LOG_DIR}/${curDate}.log`)
}
