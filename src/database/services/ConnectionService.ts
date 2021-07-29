import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import ConnectionEntity from '../models/ConnectionEntity'
import { Repository } from 'typeorm'

interface ConnectionQueryModel {
  id?: number
  createDesc?: boolean
}

@Service()
export default class ConnectionService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private collectionRepository: Repository<ConnectionEntity>,
  ) {}

  public async loadConnection(
    connectionQuery: Partial<ConnectionQueryModel>,
  ): Promise<Partial<ConnectionModel> | undefined> {
    let res: ConnectionModel | undefined = undefined
    const query: ConnectionEntity | undefined = await this.collectionRepository.findOne({
      where: {
        id: connectionQuery.id,
      },
    })
    if (query === undefined) {
      return undefined
    }
    res = {
      ...query,
      protocol: query.protocol as Protocol,
      certType: query.certType as CertType,
      mqttVersion: query.mqttVersion as MqttVersion,
      isCollection: false,
    }
    return res
  }
}
