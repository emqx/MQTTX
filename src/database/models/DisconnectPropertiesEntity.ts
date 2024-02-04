import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('DisconnectPropertiesEntity')
export default class DisconnectPropertiesEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column({ type: 'varchar' })
  connectionId?: string

  @Column({ type: 'integer', nullable: true })
  sessionExpiryInterval?: number

  @Column({ type: 'varchar', nullable: true })
  reasonString?: string

  @Column({ type: 'varchar', nullable: true })
  serverReference?: string

  @Column({ type: 'varchar', nullable: true })
  userProperties?: string // Assuming JSON string for simplicity
}
