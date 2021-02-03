import log4js from 'log4js'
import { app, remote } from 'electron'
import fs from 'fs-extra'
import path from 'path'

export const getOrCreateLogDir = () => {
  const isRenderer: boolean = process.type === 'renderer'
  // Render process use remote app
  const APP: Electron.App = isRenderer ? remote.app : app

  const STORE_PATH: string = APP.getPath('userData')
  const LOG_DIR: string = path.join(STORE_PATH, 'logs')

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
  if (fs.existsSync(path.join(LOG_DIR, 'log'))) {
    // YYYY-MM-DD-hh-mm
    const curISODate = new Date().toISOString().slice(0, 19)
    const curDate = curISODate.replace(/:/g, '-')
    // rename current log to yy-mm-dd-hh-mm.log
    fs.renameSync(path.join(LOG_DIR, 'log'), path.join(LOG_DIR, `${curDate}.log`))
  }
}

/**
 * the watcher of file appender, when the file changed trigger the onDataHandler callback funtion.
 * @param filename - the file name
 * @param onDataHandler - data stream handle
 * @param onErrorHandler - data error handle
 */
export const watchFileAppender = (
  filename: string,
  onDataHandler: (buffer: Buffer) => void,
  onErrorHandler: (err: NodeJS.ErrnoException) => void,
) => {
  // Open the file for reading and appending
  fs.open(filename, 'r', function (err, fd) {
    if (err) {
      onErrorHandler(err)
      return
    }
    let buffer: Buffer
    fs.watchFile(
      filename,
      {
        persistent: true,
        interval: 100,
      },
      (curr, prev) => {
        // Compare the time before and after
        if (curr.mtime > prev.mtime && curr.size - prev.size > 0) {
          // Changes in the contents of documents
          buffer = Buffer.alloc(curr.size - prev.size)
          // (curr.size - prev.size) this is the newly added length of the log file
          handleReadFile(fd, buffer, curr.size - prev.size, prev.size, onDataHandler, onErrorHandler)
        }
      },
    )
  })
}

/**
 * Read data from stream and copy to stream
 * @param fd - the file descriptor
 * @param buffer - the file buffer
 * @param length - the length of buffer
 * @param position - the start position of buffer read
 * @param onDataHandler - handle data callback function
 * @param onErrorHandler - handle read error callback function
 */
export const handleReadFile = (
  fd: number,
  buffer: Buffer,
  length: number,
  position: number,
  onDataHandler: (buffer: Buffer) => void,
  onErrorHandler: (err: NodeJS.ErrnoException) => void,
) => {
  fs.read(fd, buffer, 0, length, position, function (err, bytesRead, buffer) {
    if (err) {
      onErrorHandler(err)
    } else {
      onDataHandler(buffer)
    }
  })
}
