import { createConnection, EntityTarget } from 'typeorm'
import ORMConfig from './database.config'

export default function useSqlite() {
  const insert = async <T>(data: T, model: EntityTarget<T>): Promise<T> => {
    const db = await createConnection(ORMConfig)
    const repository = db.getRepository(model)
    return repository.save(data)
  }
  return {
    insert,
  }
}
