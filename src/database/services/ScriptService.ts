import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { In, Not, Repository } from 'typeorm'
import ScriptEntity from '../models/ScriptEntity'

const schemaArray: SchemaType[] = ['protobuf']

@Service()
export default class ScriptService {
  constructor(
    // @ts-ignore
    @InjectRepository(ScriptEntity)
    private scriptRepository: Repository<ScriptEntity>,
  ) {}

  public async create(data: ScriptModel): Promise<ScriptModel | undefined> {
    return (await this.scriptRepository.save(data)) as ScriptEntity | undefined
  }

  public async getAll(): Promise<ScriptModel[] | undefined> {
    return (await this.scriptRepository.find()) as ScriptEntity[] | undefined
  }

  public async getAllFunction(): Promise<ScriptModel[] | undefined> {
    const query: ScriptEntity[] | undefined = await this.scriptRepository.find({
      where: {
        // FunctionList
        type: Not(In(schemaArray)),
      },
    })
    if (!query) {
      return
    }
    return query
  }

  public async getAllSchema(): Promise<ScriptModel[] | undefined> {
    const query: ScriptEntity[] | undefined = await this.scriptRepository.find({
      where: {
        // SchemaList
        type: In(schemaArray),
      },
    })
    if (!query) {
      return
    }
    return query
  }

  public async delete(id: string): Promise<ScriptModel | undefined> {
    const query: ScriptEntity | undefined = await this.scriptRepository.findOne(id)
    if (!query) {
      return
    }
    await this.scriptRepository.delete(id)
    return query
  }

  // Only for test
  public async deleteAll() {
    await this.scriptRepository.clear()
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
