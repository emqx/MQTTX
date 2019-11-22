import db from '@/datastore/index'
import { BrokerModel, ClientModel } from '@/views/brokers/types'
import { ConnectionModel } from '@/views/connections/types'
import { deleteConnection, updateConnection, loadConnections } from './connection'

type Type = 'broker' | 'client'

interface QueryClient {
  brokeruuid: string
}

interface Data {
  brokerData?: BrokerModel,
  clientData?: ClientModel,
}

const deleteConnectionList = (id: string, type: Type): void => {
  const uuid = type === 'broker' ? 'brokeruuid' : 'clientuuid'
  const connections: ConnectionModel[] | [] = loadConnections()
  connections.forEach((connection: ConnectionModel) => {
    if (connection[uuid] === id) {
      deleteConnection(connection.id as string)
    }
  })
}

const updateConnectionList = (id: string, type: Type, payload: Data): void => {
  const uuid = type === 'broker' ? 'brokeruuid' : 'clientuuid'
  const connections: ConnectionModel[] | [] = loadConnections()
  if (type === 'broker') {
    const { brokerData } = payload
    connections.forEach((connection: ConnectionModel) => {
      if (connection[uuid] === id && brokerData) {
        connection.host = brokerData.brokerAddress
        connection.port = brokerData.brokerPort
        connection.path = brokerData.path
        connection.ssl = brokerData.tls
        updateConnection(connection.id as string, connection)
      }
    })
  } else if (type === 'client') {
    const { clientData } = payload
    connections.forEach((connection: ConnectionModel) => {
      if (connection[uuid] === id && clientData) {
        connection.name = clientData.clientName
        connection.clientId = clientData.clientId
        connection.username = clientData.username || ''
        connection.password = clientData.password || ''
        connection.keepalive = clientData.keepAlive
        connection.connectTimeout = clientData.connectionTimeout || 4000
        connection.clean = clientData.cleanSession
        connection.ca = clientData.ca
        connection.cert = clientData.cert
        connection.key = clientData.key
        updateConnection(connection.id as string, connection)
      }
    })
  }
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
  const payload: Data = { brokerData: data }
  updateConnectionList(id, 'broker', payload)
  return db.update<BrokerModel>('brokers', id, data)
}

export const deleteBroker = (id: string): BrokerModel => {
  deleteClientByBroker(id)
  deleteConnectionList(id, 'broker')
  return db.remove<BrokerModel>('brokers', id)
}

export const updateClient = (
  id: string,
  data: ClientModel,
  updateConnect: boolean = false,
): ClientModel => {
  if (updateConnect) {
    const payload = { clientData: data }
    updateConnectionList(id, 'client', payload)
  }
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
  const brokers: BrokerModel[] = loadBrokers()
  const connections: ConnectionModel[] = loadConnections()
  const connectionIds = connections.map((connection) => connection.clientuuid)

  const res: Options[] = brokers.map((broker: BrokerModel): Options => {
    const clients = loadClients(broker.id as string)
    const children: Options[] = clients.map((client: ClientModel): Options => {
      const clientData: Options = {
        label: client.clientName,
        value: client.id,
      }
      if (connectionIds.includes(client.id as string)) {
        clientData.disabled = true
      }
      return clientData
    })
    return {
      label: broker.brokerName,
      value: broker.id,
      children,
    }
  })
  return res
}

export default {}
