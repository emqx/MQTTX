import { join } from 'path'
import fs from 'fs-extra'
import getAppDataPath from 'appdata-path'

import ConnectionEntity from './src/database/models/ConnectionEntity'
import MessageEntity from './src/database/models/MessageEntity'
import SubscriptionEntity from './src/database/models/SubscriptionEntity'
import ScriptEntity from './src/database/models/ScriptEntity'
import SettingEntity from './src/database/models/SettingEntity'
import CollectionEntity from './src/database/models/CollectionEntity'
import HistoryMessageHeaderEntity from './src/database/models/HistoryMessageHeaderEntity'
import HistoryMessagePayloadEntity from './src/database/models/HistoryMessagePayloadEntity'

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
  logging: process.env.NODE_ENV !== 'production',
  entities: [
    ConnectionEntity,
    MessageEntity,
    SubscriptionEntity,
    ScriptEntity,
    SettingEntity,
    CollectionEntity,
    HistoryMessageHeaderEntity,
    HistoryMessagePayloadEntity,
  ],
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
