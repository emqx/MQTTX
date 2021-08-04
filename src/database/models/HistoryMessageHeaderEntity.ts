import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('historyMessageHeaderEntity')
export default class historyMessageHeaderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'boolean' })
  retain!: boolean

  @Column({ type: 'varchar' })
  topic!: string

  @Column({ type: 'simple-enum', enum: [0, 1, 2], default: 0 })
  qos!: QoS
}
