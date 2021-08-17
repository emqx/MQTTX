import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

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
}
