import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('ScriptEntity')
export default class ScriptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'varchar' })
  script!: string
}
