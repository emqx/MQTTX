import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('SettingEntity')
export default class SettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'integer', default: 1025 })
  width!: number

  @Column({ type: 'integer', default: 749 })
  height!: number

  @Column({ type: 'boolean', default: true })
  autoCheck!: boolean

  @Column({ type: 'simple-enum', enum: ['zh', 'en', 'ja', 'tr', 'hu'], default: 'en' })
  currentLang!: 'zh' | 'en' | 'ja' | 'tr' | 'hu'

  @Column({ type: 'simple-enum', enum: ['light', 'dark', 'night'], default: 'light' })
  currentTheme!: 'light' | 'dark' | 'night'

  @Column({ type: 'integer', default: 10 })
  maxReconnectTimes!: number

  @Column({ type: 'boolean', default: true })
  autoResub!: boolean

  @Column({ type: 'boolean', default: true })
  autoScroll!: boolean

  @Column({ type: 'boolean', default: false })
  syncOsTheme!: boolean
}
