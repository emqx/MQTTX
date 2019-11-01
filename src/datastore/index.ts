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
    // Use lodash-id must use insert methods
    this.db._.mixin(LodashID)
    if (!this.db.has('windowSize').value()) {
      this.db
        .set('windowSize', {
          width: 900,
          height: 612,
        })
        .write()
    }
    if (!this.db.has('settings').value()) {
      this.db
        .set('settings', {
          autoCheck: true,
          currentLang: 'en',
          currentTheme: 'light',
        })
        .write()
    }
    if (!this.db.has('brokers').value()) {
      this.db
        .set('brokers', [])
        .write()
    }
    if (!this.db.has('clients').value()) {
      this.db
        .set('clients', [])
        .write()
    }
    if (!this.db.has('connections').value()) {
      this.db
        .set('connections', [])
        .write()
    }
  }
  // read() is to keep the data of the main process and the rendering process up to date.
  public read() {
    return this.db.read()
  }
  public get<T>(key: string): T {
    return this.read()
      .get(key)
      .value()
  }
  public find<T>(key: string, id: string): T {
    const data: $TSFixed = this.read().get(key)
    return data
      .find({ id })
      .value()
  }
  public set<T>(key: string, value: T): T {
    return this.read()
      .set(key, value)
      .write()
  }
  public insert<T>(key: string, value: T): T {
    const data: $TSFixed = this.read().get(key)
    return data
      .insert(value)
      .write()
  }
  public update<T>(key: string, id: string, value: T): T {
    const data: $TSFixed = this.read().get(key)
    return data
      .find({ id })
      .assign(value)
      .write()
  }
  public remove<T>(key: string, id: string): T {
    const data: $TSFixed = this.read().get(key)
    return data
      .removeById(id)
      .write()
  }
  public filter<T, K>(key: string, query: K): T {
    const data: $TSFixed = this.read().get(key)
    return data
      .filter(query)
      .value()
  }
  public has(key: string): boolean {
    return this.read()
      .has(key)
      .value()
  }
}

export default new DB()
