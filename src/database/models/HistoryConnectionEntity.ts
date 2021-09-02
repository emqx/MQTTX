import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm'
import WillEntity from './WillEntity'

type Protocol = 'ws' | 'wss' | 'mqtt' | 'mqtts'
type CertType = '' | 'server' | 'self'

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

  @OneToOne(() => WillEntity, (will) => will.connection, { onDelete: 'CASCADE' })
  @JoinColumn()
  will?: WillEntity

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt?: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updateAt?: string
}
