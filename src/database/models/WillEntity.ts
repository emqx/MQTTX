import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

type QoS = 0 | 1 | 2

@Entity('WillEntity')
export default class WillEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column({ type: 'varchar', default: '' })
  lastWillTopic!: string

  @Column({ type: 'varchar', default: '' })
  lastWillPayload!: string

  @Column({ type: 'simple-enum', enum: [0, 1, 2], default: 0 })
  lastWillQos!: QoS

  @Column({ type: 'boolean', default: false })
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
