import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

@Entity('MessageEntity')
export default class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt!: string

  @Column({ type: 'boolean' })
  out!: boolean

  @Column({ type: 'varchar' })
  payload!: string

  @Column({ type: 'simple-enum', enum: [0, 1, 2], default: 0 })
  qos!: QoS

  @Column({ type: 'boolean' })
  retain!: boolean

  @Column({ type: 'varchar' })
  topic!: string

  @ManyToOne(() => ConnectionEntity, (connection) => connection.messages, { onDelete: 'CASCADE' })
  connection!: ConnectionEntity
}
