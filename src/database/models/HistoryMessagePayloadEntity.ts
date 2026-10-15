import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

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

  @ManyToOne(() => ConnectionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connection_id', referencedColumnName: 'id' })
  connection?: ConnectionEntity

  @Column({ name: 'connection_id' })
  connectionId!: string
}
