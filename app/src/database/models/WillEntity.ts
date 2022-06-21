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

  // WillPropertiesModel begin
  @Column({ type: 'integer', nullable: true, default: null })
  willDelayInterval?: number | null

  @Column({ type: 'boolean', nullable: true, default: null })
  payloadFormatIndicator?: boolean | null

  @Column({ type: 'integer', nullable: true, default: null })
  messageExpiryInterval?: number | null

  @Column({ type: 'varchar', nullable: true, default: null })
  contentType?: string | null

  @Column({ type: 'varchar', nullable: true, default: null })
  responseTopic?: string | null

  @Column({ type: 'varchar', nullable: true, default: null })
  correlationData?: string | null

  // origin type `object`
  @Column({ type: 'varchar', nullable: true, default: null })
  userProperties?: string | null
  // WillPropertiesModel end

  @OneToOne(() => ConnectionEntity, (connection) => connection.will, { onDelete: 'CASCADE' })
  connection?: ConnectionEntity
}
