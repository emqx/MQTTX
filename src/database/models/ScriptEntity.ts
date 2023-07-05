import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('ScriptEntity')
export default class ScriptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'varchar' })
  script!: string

  @Column({ type: 'varchar', nullable: true, default: null })
  type?: string | null
}
