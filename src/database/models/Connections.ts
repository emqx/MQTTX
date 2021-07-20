import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('Connections')
export default class Connections {
  @PrimaryGeneratedColumn()
  id?: number

  @Column()
  name!: string

  @Column()
  clientId!: string
}
