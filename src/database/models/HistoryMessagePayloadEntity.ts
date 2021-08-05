import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('historyMessagePayloadEntity')
export default class HistoryMessagePayloadEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  payload!: string

  @Column({ type: 'simple-enum', enum: ['Plaintext', 'Base64', 'JSON', 'Hex'], default: 'JSON' })
  payloadType!: PayloadType

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt?: Date
}
