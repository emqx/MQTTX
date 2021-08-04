import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

@Entity('SubscriptionEntity')
export default class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  topic!: string

  @Column({ type: 'simple-enum', enum: [0, 1, 2], default: 0 })
  qos!: QoS

  @Column({ type: 'varchar' })
  alias!: string

  @Column({ type: 'boolean' })
  retain!: boolean

  @Column({ type: 'varchar' })
  color!: string

  @ManyToOne(() => ConnectionEntity, (connection) => connection.messages, { onDelete: 'CASCADE' })
  connection!: ConnectionEntity
}
