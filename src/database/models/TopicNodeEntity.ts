import { Entity, PrimaryColumn, Column, Tree, TreeChildren, TreeParent, OneToOne, JoinColumn, ManyToOne } from 'typeorm'
import MessageEntity from './MessageEntity'
import ConnectionEntity from './ConnectionEntity'

@Entity('TopicNodeEntity')
@Tree('closure-table')
export default class TopicNodeEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  label!: string

  @Column({ default: 0 })
  messageCount!: number

  @Column({ default: 0 })
  subTopicCount!: number

  @ManyToOne(() => ConnectionEntity, { nullable: true })
  @JoinColumn({ name: 'connectionId' })
  connection?: ConnectionEntity

  @TreeParent()
  parent?: TopicNodeEntity

  @TreeChildren()
  children?: TopicNodeEntity[]

  @OneToOne(() => MessageEntity, { nullable: true })
  @JoinColumn()
  message?: MessageEntity
}
