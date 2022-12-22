import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'
import { Repository } from 'typeorm'

@Service()
export default class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private subscriptionRepository: Repository<SubscriptionEntity>,
  ) {}

  public async getSubscriptions(connectionId: string) {
    return await this.subscriptionRepository
      .createQueryBuilder()
      .where('connectionId = :connectionId', { connectionId })
      .orderBy('createAt', 'DESC')
      .getMany()
  }

  public async updateSubscriptions(connectionId: string, subs: SubscriptionEntity[]) {
    subs.forEach((sub) => {
      sub.connectionId = connectionId
    })
    await this.subscriptionRepository.delete({ connectionId })
    await this.subscriptionRepository.save(subs)
  }
}
