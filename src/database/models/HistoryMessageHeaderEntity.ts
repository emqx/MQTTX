import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

type QoS = 0 | 1 | 2

@Entity('historyMessageHeaderEntity')
export default class HistoryMessageHeaderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'boolean' })
  retain!: boolean

  @Column({ type: 'varchar' })
  topic!: string

  @Column({ type: 'simple-enum', enum: [0, 1, 2], default: 0 })
  qos!: QoS

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt?: string

  @ManyToOne(() => ConnectionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connection_id', referencedColumnName: 'id' })
  connection?: ConnectionEntity

  @Column({ name: 'connection_id' })
  connectionId!: string
}
