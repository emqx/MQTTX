import { ClientModel, BrokerModel } from '@/views/brokers/types'

export interface ConnectionModel  {
  readonly id?: string,
  readonly clientuuid: string,
  readonly brokeruuid: string,
  connected: boolean,
}

export interface ConnectionListModel extends BrokerModel, ClientModel {
}
