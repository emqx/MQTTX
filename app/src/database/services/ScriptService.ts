import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import ScriptEntity from '../models/ScriptEntity'

@Service()
export default class ScriptService {
  constructor(
    @InjectRepository(ScriptEntity)
    private scriptRepository: Repository<ScriptEntity>,
  ) {}

  public async create(data: ScriptModel): Promise<ScriptModel | undefined> {
    return (await this.scriptRepository.save(data)) as ScriptEntity | undefined
  }

  public async getAll(): Promise<ScriptModel[] | undefined> {
    return (await this.scriptRepository.find()) as ScriptEntity[] | undefined
  }

  public async delete(id: string): Promise<ScriptModel | undefined> {
    const query: ScriptEntity | undefined = await this.scriptRepository.findOne(id)
    if (!query) {
      return
    }
    await this.scriptRepository.delete(id)
    return query
  }

  public async update(id: string, data: ScriptModel): Promise<ScriptModel | undefined> {
    const query: ScriptEntity | undefined = await this.scriptRepository.findOne(id)
    if (!query) {
      return
    }
    const res: ScriptModel | undefined = await this.scriptRepository.save({
      ...data,
      id: query.id,
    })
    return res
  }

  public async get(id: string): Promise<ScriptModel | undefined> {
    return (await this.scriptRepository.findOne(id)) as ScriptEntity | undefined
  }
}
