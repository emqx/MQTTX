import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import SettingEntity from '../models/SettingEntity'
import { Repository } from 'typeorm'

@Service()
export default class SettingService {
  constructor(
    @InjectRepository(SettingEntity)
    private settingRepository: Repository<SettingEntity>,
  ) {}

  public async set() {
    const data = await this.settingRepository.find()
    if (data.length) {
      return
    }
    return await this.settingRepository.insert({})
  }

  public async get() {
    const data = await this.settingRepository.find()
    if (!data.length) {
      return
    }
    return data[0]
  }
  public async update(payload: SettingModel) {
    const setting = await this.get()
    if (!setting) {
      return
    }
    const { id } = setting
    return await this.settingRepository.update(id, payload)
  }
}
