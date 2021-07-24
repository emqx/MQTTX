import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('historyMessageHeaderEntity')
export default class historyMessageHeaderEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id?: number

  @Column({ type: 'boolean' })
  retain!: boolean

  @Column({ type: 'varchar' })
  topic!: string

  @Column({ type: 'integer' })
  qos!: number
}
