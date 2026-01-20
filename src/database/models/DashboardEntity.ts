import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import WidgetEntity from './WidgetEntity'

@Entity('DashboardEntity')
export default class DashboardEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  description?: string

  @Column({ type: 'integer', nullable: true })
  orderId?: number

  @Column({ type: 'simple-json', nullable: true })
  globalSettings?: any

  @OneToMany(() => WidgetEntity, (widget: WidgetEntity) => widget.dashboard, { cascade: true })
  widgets!: WidgetEntity[]

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt!: string

  @UpdateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updateAt!: string
}
