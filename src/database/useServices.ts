import { Container } from 'typedi'
import ConnectionService from './services/ConnectionService'
import SettingService from './services/SettingService'

export default function useServices() {
  const connectionService = Container.get(ConnectionService)
  const settingService = Container.get(SettingService)
  return {
    connectionService,
    settingService,
  }
}
