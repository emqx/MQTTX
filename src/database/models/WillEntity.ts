import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

@Entity('WillEntity')
export default class WillEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id?: number

  @Column({ type: 'varchar' })
  lastWillTopic!: string

  @Column({ type: 'varchar' })
  lastWillPayload!: string

  @Column({ type: 'varchar' })
  lastWillQos!: string

  @Column({ type: 'boolean' })
  lastWillRetain!: boolean

  @Column({ type: 'integer' })
  willDelayInterval!: number

  @Column({ type: 'boolean' })
  payloadFormatIndicator!: boolean

  @Column({ type: 'integer' })
  messageExpiryInterval!: number

  @Column({ type: 'varchar' })
  contentType!: string

  @OneToOne(() => ConnectionEntity, (connection) => connection.will)
  connection!: ConnectionEntity
}
