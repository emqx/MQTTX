import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('ScriptEntity')
export default class ScriptEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id?: number

  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'varchar' })
  script!: string
}
