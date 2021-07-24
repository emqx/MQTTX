import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

@Entity('CollectionEntity')
export default class CollectionEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id?: number

  @Column({ type: 'varchar' })
  payload!: string

  @Column({ type: 'varchar' })
  payloadType!: string

  @Column({ type: 'integer', comment: 'order in the collection' })
  orderId!: number

  @OneToMany(() => ConnectionEntity, (connection) => connection.collection)
  connections!: ConnectionEntity[]

  @OneToMany(() => CollectionEntity, (collection) => collection.id)
  collections!: CollectionEntity[]
}
