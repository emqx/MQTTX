// see https://typeorm.io/#/entities/column-types-for-sqlite--cordova--react-native--expo
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, OneToOne, JoinColumn } from 'typeorm'
import MessageEntity from './MessageEntity'
import SubscriptionEntity from './SubscriptionEntity'
import CollectionEntity from './CollectionEntity'
import WillEntity from './WillEntity'
@Entity('ConnectionEntity')
export default class ConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  clientId!: string

  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'boolean', default: true })
  clean!: boolean

  @Column({ type: 'simple-enum', enum: ['ws', 'wss', 'mqtt', 'mqtts'], default: 'mqtt' })
  protocol!: Protocol

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
  certType!: CertType

  @Column({ type: 'boolean' })
  ssl!: boolean

  @Column({ type: 'varchar' })
  mqttVersion!: string

  @Column({ type: 'integer' })
  unreadMessageCount!: number

  @Column({ type: 'boolean' })
  clientIdWithTime!: boolean

  @ManyToOne(() => CollectionEntity, (collection) => collection.collections, { onDelete: 'CASCADE' })
  collection!: ConnectionEntity

  @Column({ type: 'integer', nullable: true, comment: 'order in the collection' })
  orderId!: number

  @Column({ type: 'boolean' })
  rejectUnauthorized!: boolean

  @Column({ type: 'varchar' })
  ca!: string

  @Column({ type: 'varchar' })
  cert!: string

  @Column({ type: 'varchar' })
  key!: string

  @Column({ type: 'boolean', default: false })
  isCollection!: false

  @OneToOne(() => WillEntity, (will) => will.connection, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  will!: WillEntity

  @OneToMany(() => MessageEntity, (message) => message.connection)
  messages!: MessageEntity[]

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.connection)
  subscriptions!: SubscriptionEntity[]

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt!: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updateAt!: string
}
