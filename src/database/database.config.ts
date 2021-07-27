import { join } from 'path'
import fs from 'fs-extra'
import { getAppDataPath } from 'appdata-path'
const STORE_PATH = getAppDataPath('MQTTX')
import ConnectionEntity from './models/ConnectionEntity'
import MessageEntity from './models/MessageEntity'
import SubscriptionEntity from './models/SubscriptionEntity'
import ScriptEntity from './models/ScriptEntity'
import SettingEntity from './models/SettingEntity'
import CollectionEntity from './models/CollectionEntity'
import HistoryMessageHeaderEntity from './models/HistoryMessageHeaderEntity'
import HistoryMessagePayloadEntity from './models/HistoryMessagePayloadEntity'
import { ConnectionOptions } from 'typeorm'

try {
  if (!fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }
} catch (err) {
  console.error(err)
}

const ORMConfig = {
  type: 'sqlite',
  name: 'MQTTX',
  driver: 'sqlite',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  database: join(STORE_PATH, 'MQTTX.db'),
  migrations: ['database/migration/*{.ts,.js}'],
  migrationsTableName: 'temp_migration_table',
  migrationsRun: true,
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
  cli: {
    migrationsDir: 'src/database/migration',
    subscribersDir: 'src/database/subscriber',
    entitiesDir: 'src/database/models',
  },
} as ConnectionOptions
export default ORMConfig
