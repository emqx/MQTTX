import { Container } from 'typedi'
import ConnectionService from './services/ConnectionService'
import WillService from './services/WillService'
import SettingService from './services/SettingService'
import CollectionService from './services/CollectionService'
import SubscriptionService from './services/SubscriptionService'
import HistoryMessageHeaderService from './services/HistoryMessageHeaderService'
import HistoryMessagePayloadService from './services/HistoryMessagePayloaderService'
import MessageService from './services/MessageService'
import ScriptService from './services/ScriptService'
import CopilotService from './services/CopilotService'
import TopicNodeService from './services/TopicNodeService'

export default function useServices() {
  const connectionService = Container.get(ConnectionService)
  const willService = Container.get(WillService)
  const settingService = Container.get(SettingService)
  const collectionService = Container.get(CollectionService)
  const subscriptionService = Container.get(SubscriptionService)
  const historyMessageHeaderService = Container.get(HistoryMessageHeaderService)
  const historyMessagePayloadService = Container.get(HistoryMessagePayloadService)
  const messageService = Container.get(MessageService)
  const scriptService = Container.get(ScriptService)
  const copilotService = Container.get(CopilotService)
  const topicNodeService = Container.get(TopicNodeService)

  return {
    connectionService,
    willService,
    settingService,
    collectionService,
    subscriptionService,
    historyMessageHeaderService,
    historyMessagePayloadService,
    messageService,
    scriptService,
    copilotService,
    topicNodeService,
  }
}
