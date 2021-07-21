import { ConnectionOptions, createConnection, EntityTarget } from 'typeorm'

export default function useSqlite(config: ConnectionOptions) {
  const insert = async <T>(data: T, model: EntityTarget<T>): Promise<T> => {
    const db = await createConnection(config)
    const repository = db.getRepository(model)
    return repository.save(data)
  }
  return {
    insert,
  }
}
