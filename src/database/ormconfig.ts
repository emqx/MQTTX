import path from 'path'
import fs from 'fs-extra'
import { app, remote } from 'electron'
import { ConnectionOptions } from 'typeorm'
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

const config: ConnectionOptions = {
  type: 'sqlite',
  name: 'MQTTX',
  logging: process.env.NODE_ENV !== 'production',
  synchronize: true, // Remove it when code is stabled. Replace to script: schema:sync
  database: path.join(STORE_PATH, 'MQTTX.db'),
  entities: [Connections],
}

export default config
