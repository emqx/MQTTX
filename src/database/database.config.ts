import { join } from 'path'
import fs from 'fs-extra'
import { getAppDataPath } from 'appdata-path'
import ConnectionEntity from './models/ConnectionEntity'
import MessageEntity from './models/MessageEntity'
import SubscriptionEntity from './models/SubscriptionEntity'
import ScriptEntity from './models/ScriptEntity'
import SettingEntity from './models/SettingEntity'
import CollectionEntity from './models/CollectionEntity'
import HistoryMessageHeaderEntity from './models/HistoryMessageHeaderEntity'
import HistoryMessagePayloadEntity from './models/HistoryMessagePayloadEntity'
import WillEntity from './models/WillEntity'
import { ConnectionOptions } from 'typeorm'
import { initTable1627697951611 } from './migration/1627697951611-initTable'

const STORE_PATH = getAppDataPath('MQTTX')
try {
  if (!fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }
} catch (err) {
  console.error(err)
}

const ORMConfig = {
  type: 'sqlite',
  driver: 'sqlite',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  database: join(STORE_PATH, 'MQTTX.db'),
  cache: true,
  timezone: 'Z',
  migrations: [],
  migrationsTableName: 'temp_migration_table',
  entities: [
    ConnectionEntity,
    MessageEntity,
    SubscriptionEntity,
    ScriptEntity,
    SettingEntity,
    CollectionEntity,
    HistoryMessageHeaderEntity,
    HistoryMessagePayloadEntity,
    WillEntity,
  ],
  cli: {
    migrationsDir: 'src/database/migration',
    subscribersDir: 'src/database/subscriber',
    entitiesDir: 'src/database/models',
  },
} as ConnectionOptions
export default ORMConfig
