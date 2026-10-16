import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('AgentConversationEntity')
export default class AgentConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', default: '' })
  title!: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt!: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updateAt!: string
}
