import db from '@/datastore/index'
import { BrokerModel, ClientModel } from '@/views/brokers/types'
import { ConnectionModel } from '@/views/connections/types'
import { deleteConnection, updateConnection, loadConnections } from './connection'

interface QueryClient {
  brokeruuid: string
}

const deleteConnectionList = (id: string, type: 'broker' | 'client'): void => {
  const uuid = type === 'broker' ? 'brokeruuid' : 'clientuuid'
  const connections: ConnectionModel[] | [] = loadConnections()
  connections.forEach((connection: ConnectionModel) => {
    if (connection[uuid] === id) {
      deleteConnection(connection.id as string)
    }
  })
}

const updateConnectionList = (brokeruuid: string, data: BrokerModel): void => {
  const connections: ConnectionModel[] | [] = loadConnections()
  connections.forEach((connection: ConnectionModel) => {
    if (connection.brokeruuid === brokeruuid) {
      connection.host = data.brokerAddress
      connection.port = data.brokerPort
      connection.path = data.path
      connection.ssl = data.tls
      updateConnection(connection.id as string, connection)
    }
  })
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
  updateConnectionList(id, data)
  return db.update<BrokerModel>('brokers', id, data)
}

export const deleteBroker = (id: string): BrokerModel => {
  deleteClientByBroker(id)
  deleteConnectionList(id, 'broker')
  return db.remove<BrokerModel>('brokers', id)
}

export const updateClient = (id: string, data: ClientModel): ClientModel => {
  return db.update<ClientModel>('clients', id, data)
}

export const createClient = (data: ClientModel): ClientModel => {
  return db.insert<ClientModel>('clients', data)
}

export const loadClients = (brokeruuid: string): ClientModel[] => {
  const query: QueryClient = {
    brokeruuid,
  }
  return db.filter<ClientModel[], QueryClient>('clients', query)
}

export const loadClient = (id: string): ClientModel => {
  return db.find<ClientModel>('clients', id)
}

export const deleteClientByBroker = async (brokeruuid: string): Promise<ClientModel[]> => {
  let brokerClients: ClientModel[] | [] = await loadClients(brokeruuid)
  if (brokerClients.length) {
    brokerClients = brokerClients.map((client: ClientModel) => {
      return deleteClient(client.id as string)
    })
  }
  return brokerClients
}

export const deleteClient = (clientId: string): ClientModel => {
  deleteConnectionList(clientId, 'client')
  return db.remove<ClientModel>('clients', clientId)
}

export const loadClientOptions = (): Options[] => {
  const brokers: BrokerModel[] | [] = db.get<BrokerModel[]>('brokers')
  const res: Options[] = brokers.map((broker: BrokerModel): Options => {
    const clients = loadClients(broker.id as string)
    const children: Options[] = clients.map((client: ClientModel): Options => (
      {
        label: client.clientName,
        value: client.id,
      }
    ))
    return {
      label: broker.brokerName,
      value: broker.id,
      children,
    }
  })
  return res
}

export default {}
