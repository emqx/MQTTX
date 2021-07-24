import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'

@Entity('SettingEntity')
export default class SettingEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  settingID?: number

  // the name of setting
  @Column({ type: 'varchar' })
  settingKey!: string

  @Column({ type: 'varchar' })
  settingValue!: string

  // 0: text 1: number 2: boolean
  @Column({ type: 'integer' })
  settingType!: number

  @Column({ type: 'timestamp' })
  updateTime!: string
}
