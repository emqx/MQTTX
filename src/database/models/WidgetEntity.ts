import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import DashboardEntity from './DashboardEntity'

@Entity('WidgetEntity')
export default class WidgetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => DashboardEntity, (dashboard) => dashboard.widgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dashboard_id', referencedColumnName: 'id' })
  dashboard?: DashboardEntity

  @Column({ name: 'dashboard_id' })
  dashboardId!: string

  @Column({ type: 'integer' })
  x!: number

  @Column({ type: 'integer' })
  y!: number

  @Column({ type: 'integer' })
  w!: number

  @Column({ type: 'integer' })
  h!: number

  @Column({ type: 'boolean', default: false })
  'static'!: boolean

  @Column({ type: 'integer', nullable: true })
  minW?: number

  @Column({ type: 'integer', nullable: true })
  minH?: number

  @Column({ type: 'integer', nullable: true })
  maxW?: number

  @Column({ type: 'integer', nullable: true })
  maxH?: number

  @Column({ type: 'varchar' })
  type!: string

  @Column({ type: 'varchar', nullable: true })
  title?: string

  @Column({ type: 'varchar', nullable: true })
  connectionId?: string

  @Column({ type: 'varchar', nullable: true })
  topicPattern?: string

  @Column({ type: 'varchar', nullable: true })
  valueField?: string

  @Column({ type: 'float', default: 0 })
  fallbackValue!: number

  // Schema support (updated for integration)
  @Column({ type: 'simple-enum', enum: ['protobuf', 'avro'], nullable: true })
  schemaType?: 'protobuf' | 'avro'

  @Column({ type: 'varchar', nullable: true })
  schemaId?: string

  @Column({ type: 'varchar', nullable: true })
  schemaMessageName?: string

  @Column({ type: 'simple-json', nullable: true })
  widgetOptions?: {}

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt!: string

  @UpdateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updateAt!: string
}
