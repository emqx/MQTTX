import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('historyMessagePayloadEntity')
export default class historyMessagePayloadEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id?: number

  @Column({ type: 'varchar' })
  payload!: string

  @Column({ type: 'varchar' })
  payloadType!: string
}
