import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

@Entity('WillEntity')
export default class WillEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column({ type: 'varchar' })
  lastWillTopic!: string

  @Column({ type: 'varchar' })
  lastWillPayload!: string

  @Column({ type: 'simple-enum', enum: [0, 1, 2], default: 0 })
  lastWillQos!: QoS

  @Column({ type: 'boolean' })
  lastWillRetain!: boolean

  @Column({ type: 'integer', nullable: true })
  willDelayInterval?: number

  @Column({ type: 'boolean', nullable: true })
  payloadFormatIndicator?: boolean

  @Column({ type: 'integer', nullable: true })
  messageExpiryInterval?: number

  @Column({ type: 'varchar', default: '', nullable: true })
  contentType?: string

  @OneToOne(() => ConnectionEntity, (connection) => connection.will, { onDelete: 'CASCADE' })
  connection?: ConnectionEntity
}
