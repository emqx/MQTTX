// see https://typeorm.io/#/entities/column-types-for-sqlite--cordova--react-native--expo
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, OneToOne, JoinColumn, Index } from 'typeorm'
import MessageEntity from './MessageEntity'
import SubscriptionEntity from './SubscriptionEntity'
import CollectionEntity from './CollectionEntity'
import WillEntity from './WillEntity'

type Protocol = 'ws' | 'wss' | 'mqtt' | 'mqtts'
type CertType = '' | 'server' | 'self'

@Entity('ConnectionEntity')
export default class ConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Index({ unique: true })
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

  // message push props
  @Column({ type: 'boolean', nullable: true })
  pushPropsPayloadFormatIndicator?: boolean | null

  @Column({ type: 'integer', nullable: true })
  pushPropsMessageExpiryInterval?: number | null

  @Column({ type: 'integer', nullable: true })
  pushPropsTopicAlias?: number | null

  @Column({ type: 'varchar', nullable: true })
  pushPropsResponseTopic?: string | null

  @Column({ type: 'varchar', nullable: true })
  pushPropsCorrelationData?: string | null

  @Column({ type: 'varchar', nullable: true })
  pushPropsUserProperties?: string | null

  @Column({ type: 'integer', nullable: true })
  pushPropsSubscriptionIdentifier?: number | null

  @Column({ type: 'varchar', nullable: true })
  pushPropsContentType?: string | null

  // ManyToOne entities
  @ManyToOne(() => CollectionEntity, (collection) => collection.connections, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
  parent?: CollectionEntity | null

  @Column({ name: 'parent_id', nullable: true, default: null })
  parentId?: string | null
  // ManyToOne entities ends

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

  @Column({ type: 'boolean', default: false })
  isCollection!: false

  @OneToOne(() => WillEntity, (will) => will.connection, { onDelete: 'CASCADE' })
  @JoinColumn()
  will?: WillEntity

  @OneToMany(() => MessageEntity, (message) => message.connection)
  messages!: MessageEntity[]

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.connection)
  subscriptions!: SubscriptionEntity[]

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt!: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updateAt!: string

  // MQTT5 Properties begin
  @Column({ type: 'integer', nullable: true })
  sessionExpiryInterval?: number

  @Column({ type: 'integer', nullable: true })
  receiveMaximum?: number

  @Column({ type: 'integer', nullable: true })
  maximumPacketSize?: number

  @Column({ type: 'integer', nullable: true })
  topicAliasMaximum?: number

  @Column({ type: 'boolean', nullable: true })
  requestResponseInformation?: boolean

  @Column({ type: 'boolean', nullable: true })
  requestProblemInformation?: boolean

  // origin type `object`
  @Column({ type: 'varchar', nullable: true })
  userProperties?: string

  @Column({ type: 'varchar', nullable: true })
  authenticationMethod?: string

  @Column({ type: 'varchar', nullable: true })
  authenticationData?: string
  // MQTT5 Properties end
}
