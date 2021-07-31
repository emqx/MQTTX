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
    return await this.collectionRepository.insert({})
  }
}
