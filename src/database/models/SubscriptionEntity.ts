import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

@Entity('SubscriptionEntity')
export default class SubscriptionEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id?: number

  @Column({ type: 'varchar' })
  topic!: string

  @Column({ type: 'integer' })
  qos!: number

  @Column({ type: 'varchar' })
  alias!: string

  @Column({ type: 'boolean' })
  retain!: boolean

  @Column({ type: 'varchar' })
  color!: string

  @ManyToOne(() => ConnectionEntity, (connection) => connection.messages)
  connection!: ConnectionEntity
}
