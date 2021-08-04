import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('historyMessagePayloadEntity')
export default class historyMessagePayloadEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  payload!: string

  @Column({ type: 'varchar' })
  payloadType!: string
}
