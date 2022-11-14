import Lowdb from 'lowdb'
import LocalStorage from 'lowdb/adapters/LocalStorage'
import LodashID from 'lodash-id'

interface Schema {
  windowSize: {
    height: number
    width: number
  }
  settings: {
    autoCheck: boolean
    currentLang: string
    currentTheme: string
  }
  connections: []
  suggestConnections: []
}

class DB {
  private db: Lowdb.LowdbSync<Schema>
  public constructor() {
    const adapter = new LocalStorage('db')
    this.db = Lowdb(adapter)
    // Use lodash-id must use insert methods
    this.db._.mixin(LodashID)
    if (!this.db.has('windowSize').value()) {
      this.db
        .set('windowSize', {
          width: 1025,
          height: 749,
        })
        .write()
    }
    if (!this.db.has('settings').value()) {
      this.db
        .set('settings', {
          autoCheck: true,
          currentLang: 'en',
          currentTheme: 'light',
          autoResub: true,
          autoScroll: true,
          multiTopics: true,
          maxReconnectTimes: 10,
        })
        .write()
    }
    // Set auto scroll interval to 1 second by default
    if (!this.db.has('settings.autoScrollInterval').value()) {
      this.db.set('settings.autoScrollInterval', 1).write()
    }
    // Set max reconnection times
    if (!this.db.get('settings.maxReconnectTimes').value()) {
      this.db.set('settings.maxReconnectTimes', 10).write()
    }
    // Purple to Night
    if (this.db.get('settings.currentTheme').value() === 'purple') {
      this.db.set('settings.currentTheme', 'night').write()
    }
    if (this.db.has('brokers').value()) {
      this.db.unset('brokers').write()
    }
    if (this.db.has('clients').value()) {
      this.db.unset('clients').write()
    }
    if (!this.db.has('connections').value()) {
      this.db.set('connections', []).write()
    }
    if (!this.db.has('suggestConnections').value()) {
      this.db.set('suggestConnections', []).write()
    }
    if (!this.db.has('payloadsHistory').value()) {
      this.db.set('payloadsHistory', []).write()
    }
    if (!this.db.has('headersHistory').value()) {
      this.db.set('headersHistory', []).write()
    }
  }
  // read() is to keep the data of the main process and the rendering process up to date.
  public read() {
    return this.db.read()
  }
  public get<T>(key: string): T {
    return this.read().get(key).value()
  }
  public find<T>(key: string, id: string): T {
    const data: $TSFixed = this.read().get(key)
    return data.find({ id }).value()
  }
  public findChild<T>(key: string, id: string): T {
    const data: $TSFixed = this.read().get(key)
    return data.find({ id })
  }
  public set<T>(key: string, value: T): T {
    return this.read().set(key, value).write()
  }
  public insert<T>(key: string, value: T): T {
    const data: $TSFixed = this.read().get(key)
    return data.insert(value).write()
  }
  public update<T>(key: string, id: string, value: T): T {
    const data: $TSFixed = this.read().get(key)
    return data.find({ id }).assign(value).write()
  }
  public remove<T>(key: string, id: string): T {
    const data: $TSFixed = this.read().get(key)
    return data.removeById(id).write()
  }
  public filter<T, K>(key: string, query: K): T {
    const data: $TSFixed = this.read().get(key)
    return data.filter(query).value()
  }
  public has(key: string): boolean {
    return this.read().has(key).value()
  }
}

export default new DB()
