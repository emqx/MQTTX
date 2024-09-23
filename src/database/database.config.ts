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
import CopilotEntity from './models/CopilotEntity'
import { ConnectionOptions } from 'typeorm'
import { initTable1629476510574 } from './migration/1629476510574-initTable'
import { messages1630403733964 } from './migration/1630403733964-messages'
import { collection1630497638704 } from './migration/1630497638704-collection'
import { historyConnections1630572256038 } from './migration/1630572256038-historyConnections'
import { suggestionConnection1631953873460 } from './migration/1631953873460-suggestionConnection'
import { subCreateAt1633706652456 } from './migration/1633706652456-subCreateAt'
import { subMQTT51634217810526 } from './migration/1634217810526-subMQTT5'
import { mqtt51634794446353 } from './migration/1634794446353-mqtt5'
import { autoScroll1635155945767 } from './migration/1635155945767-autoScroll'
import { huLang1635392304194 } from './migration/1635393164071-huLang'
import { messageProps1637636965786 } from './migration/1637636965786-messageProps'
import { enhanceMessageType1638081576988 } from './migration/1638081576988-enhanceMessageType'
import { messageHistoryProps1638375518392 } from './migration/1638375518392-messageHistoryProps'
import { clientid1639031638009 } from './migration/1639031638009-clientid'
import { subscriptionIdentifier1639375963172 } from './migration/1639375963172-subscriptionIdentifier'
import { syncOsTheme1639730106721 } from './migration/1639730106721-syncOsTheme'
import { topicDisabled1640846307653 } from './migration/1640846307653-topicDisabled'
import { reconnectPeriod1642321826532 } from './migration/1642321826532-reconnectPeriod'
import { multiTopics1659668384878 } from './migration/1659668384878-multiTopics'
import { autoScrollInterval1668415942736 } from './migration/1668415942736-autoScrollInterval'
import { modifyDefaultValueOfAutoScrollInterval1668672504891 } from './migration/1668672504891-modifyDefaultValueOfAutoScrollInterval'
import { removeAutoScroll1673603594888 } from './migration/1673603594888-removeAutoScroll'
import { supportSchemas1688042450818 } from './migration/1688042450818-supportSchemas'
import { saveScriptName1688449795669 } from './migration/1688449795669-saveScriptName'
import { jsonHighlight1691071794840 } from './migration/1691071794840-jsonHighlight'
import { ALPNProtocols1691817588169 } from './migration/1691817588169-ALPNProtocols'
import { aiSettings1701761407723 } from './migration/1701761407723-aiSettings'
import { aiTables1701936842016 } from './migration/1701936842016-aiTables'
import { enableCopilot1703659148195 } from './migration/1703659148195-enableCopilot'
import { logLevel1704941582350 } from './migration/1704941582350-logLevel'
import { updatePayloadTypeToVarchar1630403733965 } from './migration/1705478422620-updatePayloadTypeToVarchar'
import { supportOpenAIAPIHost1716044120271 } from './migration/1716044120271-supportOpenAIAPIHost'
import { ignoreQoS0Message1724839386732 } from './migration/1724839386732-ignoreQoS0Message'
import { changeDefaultLLMModel1727111519962 } from './migration/1727111519962-changeDefaultLLMModel'

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
  logging: process.env.VUE_APP_SQL_DEBUG === 'true' ? true : ['error', 'warn'],
  database: join(STORE_PATH, 'MQTTX.db'),
  cache: true,
  timezone: 'Z',
  migrations: [
    initTable1629476510574,
    messages1630403733964,
    collection1630497638704,
    historyConnections1630572256038,
    suggestionConnection1631953873460,
    subCreateAt1633706652456,
    subMQTT51634217810526,
    mqtt51634794446353,
    autoScroll1635155945767,
    huLang1635392304194,
    messageProps1637636965786,
    enhanceMessageType1638081576988,
    messageHistoryProps1638375518392,
    clientid1639031638009,
    subscriptionIdentifier1639375963172,
    syncOsTheme1639730106721,
    topicDisabled1640846307653,
    reconnectPeriod1642321826532,
    multiTopics1659668384878,
    autoScrollInterval1668415942736,
    modifyDefaultValueOfAutoScrollInterval1668672504891,
    removeAutoScroll1673603594888,
    supportSchemas1688042450818,
    saveScriptName1688449795669,
    jsonHighlight1691071794840,
    ALPNProtocols1691817588169,
    aiSettings1701761407723,
    aiTables1701936842016,
    enableCopilot1703659148195,
    logLevel1704941582350,
    updatePayloadTypeToVarchar1630403733965,
    supportOpenAIAPIHost1716044120271,
    ignoreQoS0Message1724839386732,
    changeDefaultLLMModel1727111519962,
  ],
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
    CopilotEntity,
  ],
  cli: {
    migrationsDir: 'src/database/migration',
    subscribersDir: 'src/database/subscriber',
    entitiesDir: 'src/database/models',
  },
} as ConnectionOptions

export default ORMConfig
