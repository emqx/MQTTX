import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

type Protocol = 'ws' | 'wss' | 'mqtt' | 'mqtts'
type CertType = '' | 'server' | 'self'
type QoS = 0 | 1 | 2

@Entity('HistoryConnectionEntity')
export default class HistoryConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column({ type: 'varchar', name: 'client_id' })
  clientId!: string

  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'boolean', default: true })
  clean!: boolean

  @Column({ type: 'simple-enum', enum: ['ws', 'wss', 'mqtt', 'mqtts'], default: 'mqtt' })
  protocol?: Protocol

  @Column({ type: 'varchar' })
  host!: string

  @Column({ type: 'integer' })
  port!: number

  @Column({ type: 'integer', default: 60 })
  keepalive!: number

  @Column({ type: 'integer' })
  connectTimeout!: number

  @Column({ type: 'boolean' })
  reconnect!: boolean

  @Column({ type: 'varchar', nullable: true })
  username!: string

  @Column({ type: 'varchar', nullable: true })
  password!: string

  @Column({ type: 'varchar', nullable: true })
  path!: string

  @Column({ type: 'varchar', enum: ['', 'server', 'self'], default: '', nullable: true })
  certType?: CertType

  @Column({ type: 'boolean' })
  ssl!: boolean

  @Column({ type: 'varchar' })
  mqttVersion!: string

  @Column({ type: 'integer' })
  unreadMessageCount!: number

  @Column({ type: 'boolean', default: false, nullable: true })
  clientIdWithTime?: boolean

  @Column({ type: 'integer', nullable: true, comment: 'order in the collection' })
  orderId?: number

  @Column({ type: 'boolean', default: true, nullable: true })
  rejectUnauthorized?: boolean

  @Column({ type: 'varchar' })
  ca!: string

  @Column({ type: 'varchar' })
  cert!: string

  @Column({ type: 'varchar' })
  key!: string

  @Column({ type: 'varchar', default: '' })
  lastWillTopic!: string

  @Column({ type: 'varchar', default: '' })
  lastWillPayload!: string

  @Column({ type: 'simple-enum', enum: [0, 1, 2], default: 0 })
  lastWillQos!: QoS

  @Column({ type: 'boolean', default: false })
  lastWillRetain!: boolean

  // WillPropertiesModel begin
  @Column({ type: 'integer', nullable: true })
  willDelayInterval?: number

  @Column({ type: 'boolean', nullable: true })
  payloadFormatIndicator?: boolean

  @Column({ type: 'integer', nullable: true })
  messageExpiryInterval?: number

  @Column({ type: 'varchar', default: '', nullable: true })
  contentType?: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt?: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updateAt?: string
}
