import db from '@/datastore/index'
import { BrokerModel, ClientModel } from '@/views/brokers/types'

interface QueryClient {
  brokerId: string
}

export const loadBrokers = (): BrokerModel[] | [] => {
  return db.get<BrokerModel[] | []>('brokers')
}

export const loadBroker = (id: string): BrokerModel => {
  return db.find<BrokerModel>('brokers', id)
}

export const createBroker = (data: BrokerModel): BrokerModel => {
  return db.insert<BrokerModel>('brokers', data)
}

export const updateBroker = (id: string, data: BrokerModel): BrokerModel => {
  return db.update<BrokerModel>('brokers', id, data)
}

export const createClient = (data: ClientModel): ClientModel => {
  return db.insert<ClientModel>('clients', data)
}

export const loadClients = (brokerId: string): ClientModel[] => {
  const query: QueryClient = {
    brokerId,
  }
  return db.filter<ClientModel[], QueryClient>('clients', query)
}

export default {}
