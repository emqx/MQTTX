import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'
import type { AgentMessagePart } from '@/types/agent'

@Entity('AgentMessageEntity')
export default class AgentMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  role!: string

  @Column({ type: 'text' })
  content!: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createAt!: string

  @Column({ type: 'text', nullable: true })
  reasoning?: string

  @Column({ type: 'simple-json', nullable: true })
  parts?: AgentMessagePart[]

  @Column({ type: 'varchar', nullable: true })
  conversationId?: string
}
