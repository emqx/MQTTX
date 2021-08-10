import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

@Entity('SubscriptionEntity')
export default class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column({ type: 'varchar' })
  topic!: string

  @Column({ type: 'simple-enum', enum: [0, 1, 2], default: 0 })
  qos!: QoS

  @Column({ type: 'varchar', nullable: true })
  alias?: string

  @Column({ type: 'boolean', nullable: true, default: false })
  retain?: boolean

  @Column({ type: 'varchar', nullable: true })
  color?: string

  // ManyToOne entities
  @ManyToOne(() => ConnectionEntity, (connection) => connection.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connection_id', referencedColumnName: 'id' })
  connection?: ConnectionEntity

  @Column({ name: 'connection_id', nullable: true })
  connectionId?: string
  // ManyToOne entities ends
}
