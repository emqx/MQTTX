import { createConnection, EntityTarget, getConnectionOptions } from 'typeorm'

export default function useSqlite() {
  const insert = async <T>(data: T, model: EntityTarget<T>): Promise<T> => {
    const config = await getConnectionOptions('MQTTX')
    const db = await createConnection(config)
    const repository = db.getRepository(model)
    return repository.save(data)
  }
  return {
    insert,
  }
}
