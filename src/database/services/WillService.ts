import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import WillEntity from '../models/WillEntity'
import { Repository } from 'typeorm'

@Service()
export default class WillService {
  constructor(
    // @ts-ignore
    @InjectRepository(WillEntity)
    private willRepository: Repository<WillEntity>,
  ) {}

  public static modelToEntity(model: WillModel): WillEntity {
    const {
      id,
      properties = {
        contentType: '',
      },
      lastWillPayload = '',
      lastWillTopic = '',
      lastWillQos = 0,
      lastWillRetain = false,
    } = model
    const data = {
      lastWillPayload,
      lastWillTopic,
      lastWillQos,
      lastWillRetain,
      willDelayInterval: properties.willDelayInterval,
      payloadFormatIndicator: properties.payloadFormatIndicator,
      messageExpiryInterval: properties.messageExpiryInterval,
      contentType: properties.contentType,
      responseTopic: properties.responseTopic,
      correlationData: properties.correlationData?.toString(),
    }
    if (id) {
      return { ...data, id }
    }
    return { ...data }
  }

  public static entityToModel(entity: WillEntity): WillModel {
    const {
      id,
      lastWillTopic,
      lastWillPayload,
      lastWillQos,
      lastWillRetain,
      willDelayInterval,
      payloadFormatIndicator,
      messageExpiryInterval,
      contentType,
      responseTopic,
      correlationData,
      userProperties,
    } = entity
    return {
      id: id,
      lastWillTopic: lastWillTopic,
      lastWillPayload: lastWillPayload,
      lastWillQos: lastWillQos,
      lastWillRetain: lastWillRetain,
      properties: {
        willDelayInterval: willDelayInterval,
        payloadFormatIndicator: payloadFormatIndicator,
        messageExpiryInterval: messageExpiryInterval,
        contentType: contentType,
        responseTopic: responseTopic,
        correlationData: correlationData,
        userProperties: userProperties ? JSON.parse(userProperties) : undefined,
      },
    }
  }

  public async get(id: string) {
    const query = await this.willRepository.findOne(id)
    return query && WillService.entityToModel(query)
  }

  public async save(will: WillModel) {
    const entity = WillService.modelToEntity(will)
    return await this.willRepository.save(entity)
  }
}
