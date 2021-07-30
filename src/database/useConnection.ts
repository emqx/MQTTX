import { Connection, useContainer, createConnection } from 'typeorm'
import { Container } from 'typedi'
import ORMConfig from './database.config'

export interface initOptionModel {
  doMigrations: boolean
  undoMigrations: boolean
}
const useConnection = () => {
  let sqlConnection: Connection | undefined = undefined
  async function ConnectionInit(initOption: Partial<initOptionModel>) {
    useContainer(Container)
    sqlConnection = await createConnection(ORMConfig)
    if (initOption.doMigrations) {
      sqlConnection.runMigrations()
    } else if (initOption.undoMigrations) {
      sqlConnection.undoLastMigration()
    }
  }
  async function ConnectionDestory() {
    if (sqlConnection) {
      await sqlConnection.close()
    }
  }
  return {
    ConnectionDestory,
    ConnectionInit,
    sqlConnection,
  }
}
export default useConnection
