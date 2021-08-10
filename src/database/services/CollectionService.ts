import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import CollectionEntity from '../models/CollectionEntity'
import ConnectionEntity from '../models/ConnectionEntity'

@Service()
export default class ConnectionService {
  constructor(
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,
    @InjectRepository(ConnectionEntity)
    private connectionRepository: Repository<ConnectionEntity>,
  ) {}

  // travel current layer of tree, composition collection and connection to children
  private travelEntity(data: CollectionEntity[], connection: ConnectionEntity[]): ConnectionModelTree[] {
    let res: ConnectionModelTree[] = []
    data.map((collection) => {
      let child: ConnectionModelTree[] = []
      if (collection && collection.collections && collection.collections.length) {
        child = this.travelEntity(collection.collections, collection.connections)
      }
      let children: ConnectionModelTree[] = child as ConnectionModelTree[]
      if (connection) {
        children = [...children, ...connection]
      }
      res.push({
        id: collection.id,
        name: collection.name,
        children,
        isCollection: true,
        isEdit: false,
        orderId: collection.orderId,
      } as ConnectionModelTree)
    })
    return res
  }

  // travel current layer of tree, deconstruct children to collection and connection
  private travelModel(
    children: ConnectionModelTree[],
    parentId?: string | undefined,
  ): {
    collection: CollectionEntity[]
    connection: ConnectionEntity[]
  } {
    let collection: CollectionEntity[] = []
    let connection: ConnectionEntity[] = []
    children.forEach(async (treeNode: ConnectionModelTree) => {
      if (treeNode.isCollection) {
        const { collection: topCollection, connection: topConnection } = this.travelModel(
          treeNode.children,
          treeNode.id,
        )
        collection.push({
          ...treeNode,
          collections: topCollection,
          connections: topConnection,
        })
      } else if (!treeNode.isCollection) {
        const parent: CollectionEntity | undefined = await this.collectionRepository.findOne(parentId)
        if (parent) {
          connection.push({
            ...treeNode,
            parent,
          })
        } else {
          connection.push(treeNode)
        }
      }
    })
    return { collection, connection }
  }

  public async setAll(data: ConnectionModelTree[] | undefined): Promise<ConnectionModelTree[] | undefined> {
    if (data && data.length) {
      const { collection, connection } = this.travelModel(data)
      await this.collectionRepository.save(collection)
      await this.connectionRepository.save(connection)
    }
    return data
  }

  public async getAll(): Promise<ConnectionModelTree[] | undefined> {
    // TODO: maybe not undefine
    const topConnections: ConnectionEntity[] = await this.connectionRepository.find({
      parent: undefined,
    })
    const query: CollectionEntity[] = await this.collectionRepository.manager
      .getTreeRepository(CollectionEntity)
      .findTrees()
    if (!query) {
      return
    }
    const collectionTree: ConnectionModelTree[] | undefined = query.map((treeNode) => {
      return {
        id: treeNode.id,
        children: this.travelEntity(treeNode.collections, treeNode.connections),
        name: treeNode.name,
        isCollection: true,
        isEdit: false,
        orderId: treeNode.orderId,
      }
    })
    return [...collectionTree, ...topConnections] as ConnectionModelTree[]
  }
}
