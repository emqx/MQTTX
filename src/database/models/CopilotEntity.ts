import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'

@Entity('CopilotEntity')
export default class CopilotEntity {
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
}
