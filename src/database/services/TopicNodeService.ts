import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import TopicNodeEntity from '@/database/models/TopicNodeEntity'
import { EntityManager, Repository, TreeRepository } from 'typeorm'
import ConnectionEntity from '../models/ConnectionEntity'
import MessageService from './MessageService'
import { getMessageId } from '@/utils/idGenerator'
import ConnectionService from './ConnectionService'

@Service()
export default class TopicNodeService {
  constructor(
    // @ts-ignore
    @InjectRepository(TopicNodeEntity)
    private topicNodeRepository: TreeRepository<TopicNodeEntity>,
    // @ts-ignore
    @InjectRepository(ConnectionEntity)
    private connectionRepository: Repository<ConnectionEntity>,
    private messageService: MessageService,
  ) {}

  /**
   * Converts a TopicTreeNode model to a TopicNodeEntity
   *
   * @param model - The TopicTreeNode model to convert
   * @param parent - Optional parent TopicNodeEntity
   * @returns The converted TopicNodeEntity
   */
  public static modelToEntity(model: TopicTreeNode, parent?: TopicNodeEntity): TopicNodeEntity {
    const entity = new TopicNodeEntity()
    entity.id = model.id
    entity.label = model.label
    entity.messageCount = model.messageCount
    entity.subTopicCount = model.subTopicCount
    entity.message = model.message
    entity.parent = parent
    entity.connection = model.connectionInfo
    return entity
  }

  public async mapTopicNodesToEntities(
    topicNodes: TopicTreeNode[],
    callback: (entity: TopicNodeEntity) => void,
  ): Promise<void> {
    for (const node of topicNodes) {
      let isRoot = node.connectionInfo !== undefined
      let entity: TopicNodeEntity | null = null
      if (isRoot) {
        const connectionId = node.connectionInfo?.id
        const connection = await this.connectionRepository.findOne({ id: connectionId })
        if (!connection) {
          console.warn(`Connection with id ${connectionId} not found`)
          continue
        }
        node.connectionInfo = connection
      }
      entity = TopicNodeService.modelToEntity(node)
      callback(entity)
    }
  }

  /**
   * Converts an array of TopicTreeNode models to TopicNodeEntity objects and groups them by connection ID.
   * Also groups associated messages by connection ID.
   *
   * @param nodes - An array of TopicTreeNode objects to be converted
   * @returns A promise that resolves to an object containing:
   *          - groupedEntities: A Map of connection IDs to arrays of TopicNodeEntity objects
   *          - groupedMessages: A Map of connection IDs to arrays of MessageModel objects
   */
  async topicNodeModelToEntityWithMsgs(nodes: TopicTreeNode[]): Promise<{
    groupedEntities: Map<string, TopicNodeEntity[]>
    groupedMessages: Map<string, MessageModel[]>
  }> {
    const groupedEntities = new Map<string, TopicNodeEntity[]>()
    const groupedMessages = this.groupedMessagesByConnectionID(nodes)

    this.mapTopicNodesToEntities(nodes, (entity) => {
      const connectionId = entity.id.split('_')[0]
      if (!groupedEntities.has(connectionId)) {
        groupedEntities.set(connectionId, [])
      }
      groupedEntities.get(connectionId)!.push(entity)
    })

    this.establishParentChildRelationships(nodes, Array.from(groupedEntities.values()).flat())

    return { groupedEntities, groupedMessages }
  }

  /**
   * Establishes parent-child relationships between TopicNodeEntity objects.
   *
   * @param nodes - An array of TopicTreeNode models
   * @param entities - An array of TopicNodeEntity objects
   */
  private establishParentChildRelationships(nodes: TopicTreeNode[], entities: TopicNodeEntity[]) {
    const entityMap = new Map(entities.map((e) => [e.id, e]))

    for (const node of nodes) {
      const entity = entityMap.get(node.id)
      if (entity && node.parentId) {
        const parentEntity = entityMap.get(node.parentId)
        if (parentEntity) {
          entity.parent = parentEntity
        }
      }
    }
  }

  /**
   * Groups messages from TopicTreeNode models by connection ID.
   *
   * @param updatedNodes - An array of TopicTreeNode models
   * @returns A Map of connection IDs to arrays of MessageModel objects
   */
  private groupedMessagesByConnectionID(updatedNodes: TopicTreeNode[]): Map<string, MessageModel[]> {
    const messagesByConnection = new Map<string, MessageModel[]>()
    updatedNodes.forEach((node) => {
      if (node.message) {
        const connectionId = node.id.split('_')[0]
        if (!messagesByConnection.has(connectionId)) {
          messagesByConnection.set(connectionId, [])
        }
        node.message.id = getMessageId()
        messagesByConnection.get(connectionId)!.push({
          ...node.message,
        })
      }
    })
    return messagesByConnection
  }

  /**
   * Saves TopicTreeNode models and messages to the database.
   *
   * @param nodes - An array of TopicTreeNode models to be saved
   * @returns A promise that resolves to an object containing:
   *          - savedEntitiesCount: The number of TopicNodeEntity objects saved
   *          - savedMessagesCount: The number of MessageModel objects saved
   */
  async saveTopicNodesWithMessages(nodes: TopicTreeNode[]): Promise<{
    savedEntitiesCount: number
    savedMessagesCount: number
  }> {
    const { groupedEntities, groupedMessages } = await this.topicNodeModelToEntityWithMsgs(nodes)
    const savedEntities: TopicNodeEntity[] = []
    const savedMessages: MessageModel[] = []

    for (const [connectionId, entities] of groupedEntities) {
      const messages = groupedMessages.get(connectionId)
      // If there are messages for this connection, push them to the connection and add to savedMessages
      if (messages && messages.length > 0) {
        await this.messageService.pushMsgsToConnection(messages, connectionId)
        savedMessages.push(...messages)
      }

      // First, save entities without parent nodes
      const rootEntities = entities.filter((e) => !e.parent)
      const savedRootEntities = await this.topicNodeRepository.save(rootEntities)
      savedEntities.push(...savedRootEntities)

      // Then save entities with parent nodes
      const childEntities = entities.filter((e) => e.parent)
      for (const entity of childEntities) {
        const parent = savedEntities.find((e) => e.id === entity.parent?.id)
        if (parent) {
          entity.parent = parent
          const savedEntity = await this.topicNodeRepository.save(entity)
          savedEntities.push(savedEntity)
        } else {
          console.warn(`Parent entity with id ${entity.parent?.id} not found for entity ${entity.id}`)
        }
      }
    }

    return {
      savedEntitiesCount: savedEntities.length,
      savedMessagesCount: savedMessages.length,
    }
  }

  /**
   * Retrieves the topic tree structure
   * @returns {Promise<TopicTreeNode[]>} A promise that resolves to an array of TopicTreeNode objects
   */
  async getTree(): Promise<TopicTreeNode[]> {
    // Fetch all nodes with their associated connections and messages
    const nodes = await this.topicNodeRepository
      .createQueryBuilder('node')
      .leftJoinAndSelect('node.connection', 'connection')
      .leftJoinAndSelect('node.message', 'message')
      .getMany()

    // Retrieve the tree structure
    const tree = await this.topicNodeRepository.findTrees()

    // Create a node map for quick lookup and tree construction
    const nodeMap = new Map<string, TopicTreeNode>()
    nodes.forEach((node) => {
      nodeMap.set(node.id, {
        id: node.id,
        label: node.label,
        messageCount: node.messageCount,
        subTopicCount: node.subTopicCount,
        connectionInfo: node.connection ? ConnectionService.entityToModel(node.connection) : undefined,
        message: node.message ? MessageService.entityToModel(node.message) : undefined,
        children: [],
      })
    })

    /**
     * Recursively builds the final tree structure
     * @param {TopicNodeEntity[]} treeNodes - An array of TopicNodeEntity objects
     * @returns {TopicTreeNode[]} An array of constructed TopicTreeNode objects
     */
    const buildFinalTree = (treeNodes: TopicNodeEntity[]): TopicTreeNode[] => {
      return treeNodes
        .map((treeNode) => {
          const node = nodeMap.get(treeNode.id)
          if (!node) return null
          if (treeNode.children) {
            node.children = buildFinalTree(treeNode.children)
          }
          return node
        })
        .filter(Boolean) as TopicTreeNode[]
    }

    const finalTree = buildFinalTree(tree)

    return finalTree
  }

  /**
   * Clears all topic nodes from the repository.
   *
   * @returns A promise that resolves when all nodes have been cleared
   */
  async clearTree() {
    return await this.topicNodeRepository.clear()
  }

  /**
   * Deletes all topic nodes associated with a specific connection and their descendants.
   *
   * This method uses a recursive Common Table Expression (CTE) to identify all nodes
   * that are either directly associated with the given connection or are descendants
   * of such nodes. It then deletes all these nodes in a single operation.
   *
   * @param connectionId - The ID of the connection whose associated topic nodes should be deleted.
   * @param transactionalEntityManager - Optional EntityManager for transactional operations.
   * @returns A Promise that resolves when the deletion is complete.
   */
  public async deleteTopicNodesForConnection(
    connectionId: string,
    transactionalEntityManager?: EntityManager,
  ): Promise<void> {
    const manager = transactionalEntityManager || this.topicNodeRepository.manager

    await manager.query(
      `
      WITH RECURSIVE tree AS (
        SELECT id, parentId
        FROM TopicNodeEntity
        WHERE connectionId = ?
        
        UNION ALL
        
        SELECT t.id, t.parentId
        FROM TopicNodeEntity t
        JOIN tree ON t.parentId = tree.id
      )
      DELETE FROM TopicNodeEntity
      WHERE id IN (SELECT id FROM tree)
    `,
      [connectionId],
    )
  }

  /**
   * Updates a TopicNode by removing its association with a specific message.
   *
   * TODO: This method is a temporary solution to directly remove the message association
   * from a TopicNode. In the future, this will be updated to reflect changes in the tree view.
   *
   * @param messageId - The ID of the message to be disassociated from the TopicNode.
   * @returns A Promise that resolves when the update operation is complete.
   */
  public async updateTopicNodeByMessageId(messageId: string): Promise<void> {
    await this.topicNodeRepository
      .createQueryBuilder()
      .update(TopicNodeEntity)
      .set({ message: undefined })
      .where('message.id = :messageId', { messageId })
      .execute()
  }

  // public async syncTopicNodesFromMessages(topicNodes: TopicTreeNode[]): Promise<void> {
  //   const topicNodesEntities: TopicNodeEntity[] = []
  //   await this.mapTopicNodesToEntities(topicNodes, (entity) => {
  //     topicNodesEntities.push(entity)
  //   })
  //   this.establishParentChildRelationships(topicNodes, topicNodesEntities)
  //   await this.topicNodeRepository.save(topicNodesEntities)
  // }
}
