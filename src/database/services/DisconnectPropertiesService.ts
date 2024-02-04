import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import DisconnectPropertiesEntity from '../models/DisconnectPropertiesEntity'
import { Repository } from 'typeorm'

@Service()
export default class DisconnectPropertiesService {
  constructor(
    // @ts-ignore
    @InjectRepository(DisconnectPropertiesEntity)
    private disconnectPropertiesRepository: Repository<DisconnectPropertiesEntity>,
  ) {}

  private modelToEntity(model: DisconnectPropertiesModel): DisconnectPropertiesEntity {
    const { id, connectionId, reasonString, serverReference, sessionExpiryInterval } = model
    const entity: DisconnectPropertiesEntity = {
      id,
      connectionId,
      reasonString,
      serverReference,
      sessionExpiryInterval,
    }
    if (model.userProperties) {
      entity.userProperties = JSON.stringify(model.userProperties)
    }
    return entity
  }

  private entityToModel(entity: DisconnectPropertiesEntity): DisconnectPropertiesModel {
    const { id, connectionId, reasonString, serverReference, sessionExpiryInterval } = entity
    const model: DisconnectPropertiesModel = {
      id,
      connectionId,
      reasonString,
      serverReference,
      sessionExpiryInterval,
    }

    if (entity.userProperties) {
      model.userProperties = JSON.parse(entity.userProperties)
    }
    return model
  }

  public async create(disconnectPropertiesData: DisconnectPropertiesModel) {
    const entityData = this.modelToEntity(disconnectPropertiesData)
    const newDisconnectProperties = this.disconnectPropertiesRepository.create(entityData)
    const savedEntity = await this.disconnectPropertiesRepository.save(newDisconnectProperties)
    return this.entityToModel(savedEntity)
  }

  public async updateByConnectionId(connectionId: string, disconnectPropertiesData: DisconnectPropertiesModel) {
    const entityData = this.modelToEntity(disconnectPropertiesData)
    await this.disconnectPropertiesRepository.update({ connectionId: connectionId }, entityData)
    const updatedEntity = await this.findByConnectionId(connectionId)
    return updatedEntity
  }

  public async findByConnectionId(connectionId: string) {
    const entity = await this.disconnectPropertiesRepository.findOne({
      where: { connectionId: connectionId },
    })
    return entity ? this.entityToModel(entity) : null
  }

  public async deleteByConnectionId(connectionId: string) {
    return await this.disconnectPropertiesRepository.delete({ connectionId: connectionId })
  }
}
