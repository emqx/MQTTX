import path from 'path'
import fs from 'fs-extra'
import { app, remote } from 'electron'
import { Connection, createConnection, EntityTarget } from 'typeorm'
import Connections from './models/Connections'

const isRenderer: boolean = process.type === 'renderer'
// Render process use remote app
const APP: Electron.App = isRenderer ? remote.app : app

const STORE_PATH: string = APP.getPath('userData')

// In production mode, during the first open application
// APP.getPath('userData') gets the path nested and the datastore.js is loaded.
// if it doesn't exist, create it.
if (!isRenderer) {
  if (!fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }
}

class Database {
  private connection: Connection | null = null
  constructor() {
    this.init()
  }
  public async init(): Promise<void> {
    this.connection = await createConnection({
      type: 'sqlite',
      database: path.join(STORE_PATH, 'MQTTX.db'),
      entities: [Connections],
    })
    if (this.connection.isConnected) {
      this.connection.synchronize()
    }
  }
  public async insert<T>(value: T, model: EntityTarget<T>): Promise<T | null> {
    if (!this.connection) {
      return null
    }
    const repository = this.connection.getRepository(model)
    const data: T = value
    return repository.save(data)
  }
}

export default new Database()
