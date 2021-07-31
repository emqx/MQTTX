import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import SettingEntity from '../models/SettingEntity'
import { Repository } from 'typeorm'

@Service()
export default class SettingService {
  constructor(
    @InjectRepository(SettingEntity)
    private collectionRepository: Repository<SettingEntity>,
  ) {}

  public async setSetting() {
    const data = await this.collectionRepository.find()
    if (data.length) {
      return
    }
    return await this.collectionRepository.insert({})
  }

  public async getSetting() {
    const data = await this.collectionRepository.find()
    if (!data.length) {
      return
    }
    return data[0]
  }
}
