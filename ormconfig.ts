import { join } from 'path'
import fs from 'fs-extra'
import Connections from './src/database/models/Connections'
import getAppDataPath from 'appdata-path'

const STORE_PATH = getAppDataPath('MQTTX')

try {
  if (!fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }
} catch (err) {
  console.error(err)
}

const config = {
  type: 'sqlite',
  name: 'MQTTX',
  driver: 'sqlite',
  synchronize: false,
  entities: [Connections],
  database: join(STORE_PATH, 'MQTTX.db'),
  migrations: [join(__dirname, './src/database/migration/**/*{.ts,.js}')],
  migrationsTableName: 'temp_migration_table',
  cli: {
    migrationsDir: join(__dirname, './src/database/migration'),
    subscribersDir: join(__dirname, './src/database/subscriber'),
    entitiesDir: join(__dirname, './src/database/models'),
  },
}
export = config
