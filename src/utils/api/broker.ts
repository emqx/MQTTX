import db from '@/datastore/index'
import { BrokerModel } from '@/views/brokers/types'

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

export default {}
