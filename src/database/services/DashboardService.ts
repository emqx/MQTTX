import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import DashboardEntity from '@/database/models/DashboardEntity'
import WidgetEntity from '@/database/models/WidgetEntity'
import { WidgetModel } from '@/types/widgets'
import time from '@/utils/time'

/**
 * Service for managing dashboards and their widgets.
 * Provides CRUD operations and utility methods for dashboard ordering and cascading fetches.
 */
@Service()
export default class DashboardService {
  constructor(
    // @ts-ignore
    @InjectRepository(DashboardEntity)
    private dashboardRepository: Repository<DashboardEntity>,
  ) {}

  public static entityToModel(entity: DashboardEntity): DashboardModel {
    return {
      ...entity,
      widgets: (entity.widgets || []).map((w) => DashboardService.widgetEntityToModel(w)),
    }
  }

  public static modelToEntity(model: Partial<DashboardModel>): Partial<DashboardEntity> {
    const { widgets, ...rest } = model
    const entity: Partial<DashboardEntity> = {
      ...rest,
      widgets: widgets?.map((w) => DashboardService.widgetModelToEntity(w as WidgetModel) as WidgetEntity),
    }
    return entity
  }

  public static widgetEntityToModel(entity: WidgetEntity): WidgetModel {
    return {
      ...entity,
    } as WidgetModel
  }

  public static widgetModelToEntity(model: Partial<WidgetModel>): Partial<WidgetEntity> {
    return {
      ...model,
    } as Partial<WidgetEntity>
  }

  /**
   * Creates a new dashboard in the database.
   * If orderId is not provided, it will be set to the next available value.
   * @param data - The DashboardModel data to create.
   * @returns The created DashboardModel, or undefined if creation failed.
   */
  public async create(data: DashboardModel): Promise<DashboardModel | undefined> {
    // Auto-assign orderId if not provided
    let orderId = data.orderId
    if (orderId === undefined) {
      const maxOrderResult = await this.dashboardRepository
        .createQueryBuilder('db')
        .select('MAX(db.orderId)', 'maxOrder')
        .getRawOne()
      orderId = (maxOrderResult?.maxOrder || 0) + 1
    }

    const toSave = DashboardService.modelToEntity({
      ...data,
      orderId,
      createAt: time.getNowDate(),
      updateAt: time.getNowDate(),
    }) as DashboardEntity
    const saved = await this.dashboardRepository.save(toSave)
    return DashboardService.entityToModel(saved)
  }

  /**
   * Updates an existing dashboard by its ID.
   * Widgets are excluded from the update (handled separately).
   * @param id - The ID of the dashboard to update.
   * @param data - Partial DashboardModel data to update.
   * @returns The updated DashboardModel, or undefined if not found.
   */
  public async update(id: string, data: Partial<DashboardModel>): Promise<DashboardModel | undefined> {
    const { widgets, ...rest } = data // Exclude widgets if present
    const toUpdate = {
      ...rest,
      updateAt: time.getNowDate(),
    }
    const result = await this.dashboardRepository.update(id, toUpdate)
    if (result.affected === 0) return undefined
    return this.get(id) // Use existing get which includes widgets
  }

  /**
   * Deletes a dashboard by its ID.
   * @param id - The ID of the dashboard to delete.
   * @returns The deleted DashboardModel, or undefined if not found.
   */
  public async delete(id: string): Promise<DashboardModel | undefined> {
    const exist = await this.dashboardRepository.findOne(id)
    if (!exist) return
    await this.dashboardRepository.delete(id)
    return DashboardService.entityToModel(exist)
  }

  /**
   * Retrieves a dashboard by its ID, including its widgets.
   * @param id - The ID of the dashboard to retrieve.
   * @returns The DashboardModel if found, otherwise undefined.
   */
  public async get(id: string): Promise<DashboardModel | undefined> {
    const entity = await this.dashboardRepository
      .createQueryBuilder('db')
      .where('db.id = :id', { id })
      .leftJoinAndSelect('db.widgets', 'wg')
      .getOne()
    return entity ? DashboardService.entityToModel(entity) : undefined
  }

  /**
   * Retrieves all dashboards, ordered by orderId (or fallback), then by creation time.
   * Widgets are not included in this method.
   * @returns An array of DashboardModels.
   */
  public async getAll(): Promise<DashboardModel[]> {
    const entities = await this.dashboardRepository
      .createQueryBuilder('db')
      .orderBy('COALESCE(db.orderId, 999999)', 'ASC')
      .addOrderBy('db.createAt', 'ASC')
      .getMany()
    return entities.map((e) => DashboardService.entityToModel(e))
  }

  /**
   * Retrieves all dashboards (or a specific one if id is provided), including their widgets.
   * Results are ordered by orderId (or fallback), then by creation time.
   * @param id - (Optional) The dashboard ID to filter by.
   * @returns An array of DashboardModels.
   */
  public async cascadeGetAll(id?: string): Promise<DashboardModel[]> {
    const qb = this.dashboardRepository
      .createQueryBuilder('db')
      .leftJoinAndSelect('db.widgets', 'wg')
      .orderBy('COALESCE(db.orderId, 999999)', 'ASC')
      .addOrderBy('db.createAt', 'ASC')

    if (id) {
      qb.where('db.id = :id', { id })
    }

    const entities = await qb.getMany()
    return entities.map((e) => DashboardService.entityToModel(e))
  }

  /**
   * Batch updates the orderId of multiple dashboards for reordering.
   * @param dashboardOrderUpdates - Array of objects containing id and new orderId for each dashboard.
   * @returns True if successful, false if an error occurred.
   */
  public async updateOrders(dashboardOrderUpdates: { id: string; orderId: number }[]): Promise<boolean> {
    try {
      await this.dashboardRepository.manager.transaction(async (transactionalEntityManager) => {
        for (const update of dashboardOrderUpdates) {
          await transactionalEntityManager.update(DashboardEntity, update.id, {
            orderId: update.orderId,
            updateAt: time.getNowDate(),
          })
        }
      })
      return true
    } catch (error) {
      console.error('Error updating dashboard orders:', error)
      return false
    }
  }
}
