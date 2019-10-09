import Lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import fs from 'fs-extra'
import LodashID from 'lodash-id'
import { app, remote } from 'electron'

const isRenderer: boolean = process.type === 'renderer'
// Render process use remote app
const APP: Electron.App = isRenderer ? remote.app : app

const STORE_PATH: string = APP.getPath('userData')

// In production mode, during the first open application
// APP.getPath('userData') gets the path nested and the datastore.js is loaded.
// So if it doesn't exist, create it.
if (!isRenderer) {
  if (!fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }
}

class DB {
  private db: Lowdb.LowdbSync<any>
  public constructor() {
    const adapter: Lowdb.AdapterSync<any> = new FileSync(path.join(STORE_PATH, '/db.json'))
    this.db = Lowdb(adapter)
    this.db._.mixin(LodashID)
    if (!this.db.has('windowSize').value()) {
      this.db.set('windowSize', {
        width: 900,
        height: 612,
      }).write()
    }
    if (!this.db.has('settings').value()) {
      this.db.set('settings', {
        autoCheck: true,
        currentLang: 'en',
        currentTheme: 'light',
      }).write()
    }
  }
  // read() is to keep the data of the main process and the rendering process up to date.
  public read() {
    return this.db.read()
  }
  public get(key: string): any {
    return this.read().get(key).value()
  }
  public set(key: string, value: any): any {
    return this.read().set(key, value).write()
  }
  public has(key: string): any {
    return this.read().has(key).value()
  }
}

export default new DB()
