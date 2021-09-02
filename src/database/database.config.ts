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
import HistoryConnectionEntity from './models/HistoryConnectionEntity'
import WillEntity from './models/WillEntity'
import { ConnectionOptions } from 'typeorm'
import { initTable1629476510574 } from './migration/1629476510574-initTable'
import { messages1630403733964 } from './migration/1630403733964-messages'
import { collection1630497638704 } from './migration/1630497638704-collection'
import { historyConnections1630572256038 } from './migration/1630572256038-historyConnections'

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
  migrations: [initTable1629476510574, messages1630403733964, collection1630497638704, historyConnections1630572256038],
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
    HistoryConnectionEntity,
  ],
  cli: {
    migrationsDir: 'src/database/migration',
    subscribersDir: 'src/database/subscriber',
    entitiesDir: 'src/database/models',
  },
} as ConnectionOptions
export default ORMConfig
