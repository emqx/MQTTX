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

export const deleteBroker = (id: string): BrokerModel => {
  deleteClientByBroker(id)
  return db.remove<BrokerModel>('brokers', id)
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

export const deleteClientByBroker = async (brokerId: string): Promise<ClientModel[]> => {
  let brokerClients: ClientModel[] | [] = await loadClients(brokerId)
  if (brokerClients.length) {
    brokerClients = brokerClients.map((client: ClientModel) => {
      return deleteClient(client.id as string)
    })
  }
  return brokerClients
}

export const deleteClient = (clientId: string): ClientModel => {
  return db.remove<ClientModel>('clients', clientId)
}

export default {}
