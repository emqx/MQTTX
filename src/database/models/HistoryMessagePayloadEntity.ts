import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('historyMessagePayloadEntity')
export default class HistoryMessagePayloadEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  payload!: string

  @Column({ type: 'varchar', default: 'JSON' })
  payloadType!: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt?: string
}
