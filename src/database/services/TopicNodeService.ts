import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import TopicNodeEntity from '@/database/models/TopicNodeEntity'
import { EntityManager, Repository, TreeRepository } from 'typeorm'
import ConnectionEntity from '../models/ConnectionEntity'
import MessageService from './MessageService'
import { getMessageId } from '@/utils/idGenerator'
import ConnectionService from './ConnectionService'
import { flattenTopicTree } from '@/utils/topicTree'

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
   * Creates a TopicNodeEntity from a TopicTreeNode model.
   *
   * @param node - The TopicTreeNode model to convert
   * @param connection - Optional ConnectionEntity to associate with the node
   * @returns A new TopicNodeEntity
   */
  private createTopicNodeEntity(node: TopicTreeNode): TopicNodeEntity {
    const entity = new TopicNodeEntity()
    entity.id = node.id
    entity.label = node.label
    entity.messageCount = node.messageCount
    entity.subTopicCount = node.subTopicCount
    entity.message = node.message
    entity.connection = node.connectionInfo
      ? (ConnectionService.modelToEntity(node.connectionInfo) as ConnectionEntity)
      : undefined
    return entity
  }

  /**
   * Establishes parent-child relationships between TopicNodeEntity objects.
   *
   * @param nodes - An array of TopicTreeNode models
   * @param entities - An array of TopicNodeEntity objects
   */
  private establishNodeEntityRelationships(nodes: TopicTreeNode[], entities: TopicNodeEntity[]) {
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
   * Groups TopicNodeEntity objects by connection ID.
   *
   * @param updatedNodes - An array of TopicTreeNode models to be grouped
   * @returns A Map where keys are connection IDs and values are arrays of TopicNodeEntity objects
   */
  private groupedEntitiesByConnectionID(updatedNodes: TopicTreeNode[]): Map<string, TopicNodeEntity[]> {
    const entitiesByConnection = new Map<string, TopicNodeEntity[]>()
    updatedNodes.forEach((node) => {
      const entity = this.createTopicNodeEntity(node)
      const connectionId = node.id.split('_')[0]
      if (!entitiesByConnection.has(connectionId)) {
        entitiesByConnection.set(connectionId, [])
      }
      entitiesByConnection.get(connectionId)!.push(entity)
    })
    return entitiesByConnection
  }

  /**
   * Saves TopicTreeNode models and messages to the database.
   *
   * @param topicNodes - An array of TopicTreeNode models to be saved
   * @returns A promise that resolves to an object containing:
   *          - savedEntitiesCount: The number of TopicNodeEntity objects saved
   *          - savedMessagesCount: The number of MessageModel objects saved
   */
  async saveTopicNodesWithMessages(topicNodes: TopicTreeNode[]): Promise<{
    savedEntitiesCount: number
    savedMessagesCount: number
  }> {
    const groupedMessages = this.groupedMessagesByConnectionID(topicNodes)
    const groupedEntities = this.groupedEntitiesByConnectionID(topicNodes)
    this.establishNodeEntityRelationships(topicNodes, Array.from(groupedEntities.values()).flat())

    const savedEntities: TopicNodeEntity[] = []
    const savedMessages: MessageModel[] = []

    for (const [connectionId, entities] of groupedEntities) {
      const messages = groupedMessages.get(connectionId)
      // If there are messages for this connection, push them to the connection and add to savedMessages
      if (messages && messages.length > 0) {
        await this.messageService.pushMsgsToConnection(messages, connectionId)
        savedMessages.push(...messages)
      }
      const rootEntities = entities.filter((entity) => !entity.parent)
      await this.topicNodeRepository.save(rootEntities)
      savedEntities.push(...rootEntities)
      const otherEntities = entities.filter((entity) => entity.parent)
      await this.topicNodeRepository.save(otherEntities)
      savedEntities.push(...otherEntities)
    }

    return {
      savedEntitiesCount: savedEntities.length,
      savedMessagesCount: savedMessages.length,
    }
  }

  /**
   * Updates topic nodes based on a topic tree structure.
   *
   * This method performs the following steps:
   * 1. Deletes existing topic nodes for the given connection
   * 2. Flattens the topic tree into a linear array
   * 3. Maps the flattened nodes to TopicNodeEntity objects
   * 4. Establishes parent-child relationships between nodes
   * 5. Saves all topic node entities to the database
   *
   * @param topicTree - The topic tree structure containing nodes to update
   * @returns A Promise that resolves when the update operation is complete
   */
  public async updateTopicNodes(topicTree: TopicTreeNode): Promise<void> {
    const connectionId = topicTree.connectionInfo?.id
    if (!connectionId) return
    await this.deleteTopicNodesForConnection(connectionId)
    const flattenedNodes = flattenTopicTree(topicTree)
    const topicNodesEntities: TopicNodeEntity[] = []
    flattenedNodes.forEach((node) => {
      const entity = this.createTopicNodeEntity(node)
      topicNodesEntities.push(entity)
    })
    this.establishNodeEntityRelationships(flattenedNodes, topicNodesEntities)
    await this.topicNodeRepository.save(topicNodesEntities)
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

  /**
   * Clears all topic nodes from the repository.
   *
   * @returns A promise that resolves when all nodes have been cleared
   */
  async clearTree() {
    return await this.topicNodeRepository.clear()
  }
}
