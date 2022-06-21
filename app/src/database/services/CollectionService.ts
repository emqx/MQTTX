import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import CollectionEntity from '@/database/models/CollectionEntity'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import WillEntity from '@/database/models/WillEntity'
import time from '@/utils/time'

@Service()
export default class CollectionService {
  constructor(
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,
    @InjectRepository(ConnectionEntity)
    private connectionRepository: Repository<ConnectionEntity>,
    @InjectRepository(WillEntity)
    private willRepository: Repository<WillEntity>,
  ) {}

  // travel current layer of tree, composition collection and connection to children
  private async travelEntity(data: CollectionEntity[], parentId?: string): Promise<ConnectionModelTree[]> {
    let res: ConnectionModelTree[] = []
    let connections: ConnectionModel[] = []
    if (parentId) {
      // find current collection's connections
      const query: ConnectionEntity[] = await this.connectionRepository.find({
        parentId,
      })
      if (query && Array.isArray(query) && query.length) {
        connections = query as ConnectionModel[]
      }
    }
    await Promise.all(
      data.map(async (collection) => {
        let children: ConnectionModelTree[] = []
        if (collection) {
          const curChildrens = collection?.children ?? []
          children = await this.travelEntity(curChildrens, collection.id)
        }
        res.push({
          id: collection.id,
          name: collection.name,
          children,
          isCollection: true,
          isEdit: false,
          orderId: collection.orderId,
        } as ConnectionModelTree)
      }),
    )
    return [...res, ...connections] as ConnectionModelTree[]
  }

  // travel current layer of tree, deconstruct children to collection and connection
  private async travelModel(
    children: ConnectionModelTree[],
    parentId?: string | undefined,
  ): Promise<{ collection: CollectionEntity[]; connection: ConnectionEntity[] }> {
    let collection: CollectionEntity[] = []
    let connection: ConnectionEntity[] = []
    let parent: CollectionEntity | undefined = undefined
    if (parentId) {
      parent = await this.collectionRepository.findOne(parentId)
    }
    await Promise.all(
      children.map(async (treeNode: ConnectionModelTree, index: number) => {
        if (treeNode.isCollection) {
          const { collection: topCollection, connection: topConnection } = await this.travelModel(
            treeNode.children ? treeNode.children : [],
            treeNode.id,
          )
          collection.push({
            ...treeNode,
            children: topCollection,
            connections: topConnection,
            orderId: index,
          } as CollectionEntity)
        } else if (!treeNode.isCollection) {
          if (parent) {
            connection.push({
              ...treeNode,
              parent,
            } as ConnectionEntity)
          } else {
            connection.push(treeNode as ConnectionEntity)
          }
        }
      }),
    )
    if (collection && Array.isArray(collection) && collection.length) {
      await this.collectionRepository.save(collection)
    }
    const defaultWill = {
      lastWillTopic: '',
      lastWillPayload: '',
      lastWillQos: 0,
      lastWillRetain: false,
      contentType: '',
    }
    for (let i = 0; i < connection.length; i++) {
      const query = await this.connectionRepository.findOne({
        clientId: connection[i].clientId,
      })
      if (query) {
        const updatedConnection: ConnectionEntity = { ...connection[i], id: query.id, orderId: i } as ConnectionEntity
        let savedWill: WillEntity | undefined
        if (!updatedConnection.will) {
          savedWill = await this.willRepository.save(defaultWill as WillEntity)
        } else {
          savedWill = await this.willRepository.save(updatedConnection.will as WillEntity)
        }
        updatedConnection.will = savedWill
        await this.connectionRepository.save({
          ...updatedConnection,
          updateAt: time.getNowDate(),
        })
      } else {
        const savedWill = await this.willRepository.save(defaultWill as WillEntity)
        connection[i].will = savedWill
        await this.connectionRepository.insert({
          ...connection[i],
          orderId: i,
          updateAt: time.getNowDate(),
        })
      }
    }
    return { collection, connection }
  }

  public async setAll(data: ConnectionModelTree[] | undefined): Promise<ConnectionModelTree[] | undefined> {
    if (!data || !Array.isArray(data) || !data.length) {
      return
    }
    const { collection, connection } = await this.travelModel(data)
    if (collection && connection) {
      return [...collection, ...connection]
    }
    return
  }

  public async getAll(): Promise<ConnectionModelTree[] | undefined> {
    // get top connetctions
    const topConnections: ConnectionEntity[] = await this.connectionRepository.find({
      parentId: null,
    })
    // get top collections
    const query: CollectionEntity[] = await this.collectionRepository.manager
      .getTreeRepository(CollectionEntity)
      .findTrees()
    if (!query) {
      return
    }
    const collectionTree: ConnectionModelTree[] | undefined = await Promise.all(
      query.map(async (treeNode) => {
        const children = await this.travelEntity(treeNode.children, treeNode.id)
        return {
          id: treeNode.id,
          children,
          name: treeNode.name,
          isCollection: true,
          isEdit: false,
          orderId: treeNode.orderId,
        } as CollectionModel
      }),
    )
    return [...collectionTree, ...topConnections] as ConnectionModelTree[]
  }

  public async delete(collectionId: string) {
    const entity: CollectionEntity | undefined = await this.collectionRepository.findOne(collectionId)
    if (!entity) return
    const query: CollectionEntity[] = await this.collectionRepository.manager
      .getTreeRepository(CollectionEntity)
      .findDescendants(entity)
    if (!query) return
    for (let i = 0; i < query.length; i++) {
      const children = query[i].children
      if (!children) continue
      for (let j = 0; j < children.length; j++) {
        await this.connectionRepository.delete({
          parentId: children[j].id,
        })
      }
    }
    await this.collectionRepository.remove(query)
  }

  public async add(data: CollectionModel, parentId?: string): Promise<CollectionModel | undefined> {
    const parent: CollectionEntity | undefined = parentId
      ? await this.collectionRepository.findOne(parentId)
      : undefined
    const query = {
      id: data.id,
      name: data.name,
      orderId: data.orderId,
      isCollection: true,
      children: [],
      connections: [],
      parent,
    } as CollectionEntity
    return await this.collectionRepository.save(query)
  }

  // only update meta data without connections and children relation
  public async update(data: CollectionModel, parentId?: string) {
    const parent: CollectionEntity | undefined = parentId
      ? await this.collectionRepository.findOne(parentId)
      : undefined
    const query = await this.collectionRepository.findOne(data.id)
    if (!query) return
    await this.collectionRepository.save({
      ...query,
      name: data.name,
      orderId: data.orderId,
      isCollection: true,
      parent,
    })
  }

  // update collection's collection ID
  public async updateCollectionId(
    id: string | undefined,
    updatedCollectionId: string | null,
  ): Promise<CollectionModel | undefined> {
    if (!id) return
    const query: CollectionEntity | undefined = await this.collectionRepository.findOne(id)
    if (!query) {
      return
    }
    const parent = updatedCollectionId ? (await this.collectionRepository.findOne(updatedCollectionId)) ?? null : null
    query.parent = parent
    await this.collectionRepository.save(query)
    return query as CollectionModel
  }

  public async updateSequenceId(id: string | undefined, sequenceId: number) {
    if (!id) return
    const query: CollectionEntity | undefined = await this.collectionRepository.findOne(id)
    if (!query) return
    query.orderId = sequenceId
    await this.collectionRepository.save(query)
  }
}
