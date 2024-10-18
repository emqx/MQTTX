import { Entity, PrimaryGeneratedColumn, Column, Tree, TreeChildren, TreeParent, PrimaryColumn } from 'typeorm'

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

  @Column({ nullable: true })
  lastMessageId?: string

  @Column({ nullable: true })
  connectionId?: string

  @TreeChildren()
  children?: TopicNodeEntity[]

  @TreeParent()
  parent?: TopicNodeEntity

  @Column({ nullable: true })
  parentId?: string
}
