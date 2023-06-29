import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

type QoS = 0 | 1 | 2

@Entity('MessageEntity')
export default class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column({ type: 'varchar' })
  createAt!: string

  @Column({ type: 'boolean' })
  out!: boolean

  @Column({ type: 'varchar' })
  payload!: string | Buffer

  @Column({ type: 'simple-enum', enum: [0, 1, 2], default: 0 })
  qos!: QoS

  @Column({ type: 'boolean' })
  retain!: boolean

  @Column({ type: 'varchar' })
  topic!: string

  // MQTT5 props begin
  @Column({ type: 'boolean', nullable: true })
  payloadFormatIndicator?: boolean

  @Column({ type: 'integer', nullable: true })
  messageExpiryInterval?: number

  @Column({ type: 'integer', nullable: true })
  topicAlias?: number

  @Column({ type: 'varchar', nullable: true })
  responseTopic?: string

  @Column({ type: 'varchar', nullable: true })
  correlationData?: string

  @Column({ type: 'varchar', nullable: true })
  userProperties?: string

  @Column({ type: 'integer', nullable: true })
  subscriptionIdentifier?: number

  @Column({ type: 'varchar', nullable: true })
  contentType?: string
  // MQTT5 props end

  // ManyToOne entities
  @ManyToOne(() => ConnectionEntity, (connection) => connection.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connection_id', referencedColumnName: 'id' })
  connection?: ConnectionEntity

  @Column({ name: 'connection_id', nullable: true })
  connectionId?: string | null
  // ManyToOne entities ends
}
