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

  @Column({ type: 'boolean', default: false })
  syncOsTheme!: boolean

  @Column({ type: 'boolean', default: true })
  multiTopics!: boolean

  @Column({ type: 'boolean', default: true })
  jsonHighlight!: boolean

  @Column({ type: 'boolean', default: true })
  enableCopilot!: boolean

  @Column({ type: 'varchar', default: '' })
  openAIAPIKey!: string

  @Column({ type: 'varchar', default: 'gpt-3.5-turbo' })
  model!: string

  @Column({ type: 'simple-enum', enum: ['debug', 'info', 'warn', 'error'], default: 'info' })
  logLevel!: 'debug' | 'info' | 'warn' | 'error'
}
