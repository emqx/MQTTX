import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository, UpdateResult } from 'typeorm'
import WidgetEntity from '@/database/models/WidgetEntity'
import { WidgetModel } from '@/types/widgets'
import time from '@/utils/time'

@Service()
export default class WidgetService {
  constructor(
    // @ts-ignore
    @InjectRepository(WidgetEntity)
    private widgetRepository: Repository<WidgetEntity>,
  ) {}

  public static entityToModel(entity: WidgetEntity): WidgetModel {
    return {
      ...entity,
    } as WidgetModel
  }

  public static modelToEntity(model: Partial<WidgetModel>): Partial<WidgetEntity> {
    return {
      ...model,
    } as Partial<WidgetEntity>
  }

  /**
   * Creates a new widget in the database.
   * @param data - The WidgetModel data to create.
   * @returns The created WidgetModel, or undefined if creation failed.
   */
  public async create(data: WidgetModel): Promise<WidgetModel | undefined> {
    const toSave = WidgetService.modelToEntity({
      ...data,
      createAt: time.getNowDate(),
      updateAt: time.getNowDate(),
    }) as WidgetEntity
    const saved = await this.widgetRepository.save(toSave)
    return WidgetService.entityToModel(saved)
  }

  /**
   * Updates an existing widget by its ID.
   * @param id - The ID of the widget to update.
   * @param data - Partial WidgetModel data to update.
   * @returns The updated WidgetModel, or undefined if not found.
   */
  public async update(id: string, data: Partial<WidgetModel>): Promise<WidgetModel | undefined> {
    const toUpdate = WidgetService.modelToEntity({ ...data, updateAt: time.getNowDate() })
    const result = await this.widgetRepository.update(id, toUpdate)
    if (result.affected === 0) return undefined
    return this.get(id)
  }

  /**
   * Deletes a widget by its ID.
   * @param id - The ID of the widget to delete.
   * @returns The deleted WidgetModel, or undefined if not found.
   */
  public async delete(id: string): Promise<WidgetModel | undefined> {
    const exist = await this.widgetRepository.findOne(id)
    if (!exist) return
    await this.widgetRepository.delete(id)
    return WidgetService.entityToModel(exist)
  }

  /**
   * Retrieves a widget by its ID.
   * @param id - The ID of the widget to retrieve.
   * @returns The WidgetModel if found, otherwise undefined.
   */
  public async get(id: string): Promise<WidgetModel | undefined> {
    const entity = await this.widgetRepository.createQueryBuilder('wg').where('wg.id = :id', { id }).getOne()
    return entity ? WidgetService.entityToModel(entity) : undefined
  }

  /**
   * Retrieves all widgets, optionally filtered by dashboardId.
   * Results are ordered by dashboardId, y, and x.
   * @param dashboardId - (Optional) The dashboard ID to filter widgets.
   * @returns An array of WidgetModels.
   */
  public async getAll(dashboardId?: string): Promise<WidgetModel[]> {
    const qb = this.widgetRepository.createQueryBuilder('wg')
    if (dashboardId) {
      qb.where('wg.dashboardId = :dashboardId', { dashboardId })
    }
    qb.orderBy('wg.dashboardId', 'ASC').addOrderBy('wg.y', 'ASC').addOrderBy('wg.x', 'ASC')
    const entities = await qb.getMany()
    return entities.map((e) => WidgetService.entityToModel(e))
  }

  /**
   * Retrieves all widgets for a dashboard, or all widgets if no dashboardId is provided.
   * This is an alias for getAll.
   * @param dashboardId - (Optional) The dashboard ID to filter widgets.
   * @returns An array of WidgetModels.
   */
  public async cascadeGetAll(dashboardId?: string): Promise<WidgetModel[]> {
    return this.getAll(dashboardId)
  }

  /**
   * Batch updates the position and size of multiple widgets.
   * @param updates - Array of objects containing id, x, y, w, h for each widget.
   * @returns True if successful, false if an error occurred.
   */
  public async updateMany(
    updates: Array<{ id: string; x: number; y: number; w: number; h: number }>,
  ): Promise<boolean> {
    if (!updates || updates.length === 0) return true
    try {
      await this.widgetRepository.manager.transaction(async (transactionalEntityManager) => {
        for (const update of updates) {
          await transactionalEntityManager.update(WidgetEntity, update.id, {
            x: update.x,
            y: update.y,
            w: update.w,
            h: update.h,
            updateAt: time.getNowDate(),
          })
        }
      })
      return true
    } catch (e) {
      console.error('Error updating widgets:', e)
      return false
    }
  }
}
