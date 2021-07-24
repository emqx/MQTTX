import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

@Entity('MessageEntity')
export default class MessageEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  mid?: number

  @Column({ type: 'datetime' })
  createAt!: string

  @Column({ type: 'boolean' })
  out!: boolean

  @Column({ type: 'varchar' })
  payload!: string

  @Column({ type: 'integer' })
  qos!: number

  @Column({ type: 'boolean' })
  retain!: boolean

  @Column({ type: 'varchar' })
  topic!: string

  @ManyToOne(() => ConnectionEntity, (connection) => connection.messages)
  connection!: ConnectionEntity
}
