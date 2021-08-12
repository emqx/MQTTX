import { Container } from 'typedi'
import ConnectionService from './services/ConnectionService'
import SettingService from './services/SettingService'
import CollectionService from './services/CollectionService'
import HistoryMessageHeaderService from './services/HistoryMessageHeaderService'
import HistoryMessagePayloadService from './services/HistoryMessagePayloaderService'
import MessageService from './services/MessageService'
import ScriptService from './services/ScriptService'

export default function useServices() {
  const connectionService = Container.get(ConnectionService)
  const settingService = Container.get(SettingService)
  const collectionService = Container.get(CollectionService)
  const historyMessageHeaderService = Container.get(HistoryMessageHeaderService)
  const historyMessagePayloadService = Container.get(HistoryMessagePayloadService)
  const messageService = Container.get(MessageService)
  const scriptService = Container.get(ScriptService)
  return {
    connectionService,
    settingService,
    collectionService,
    historyMessageHeaderService,
    historyMessagePayloadService,
    messageService,
    scriptService,
  }
}
