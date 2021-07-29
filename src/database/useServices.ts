import ConnectionService from '@/database/services/ConnectionService'
import { Container } from 'typedi'

export default function useServices() {
  const connectionService = Container.get(ConnectionService)
  return {
    connectionService,
  }
}
