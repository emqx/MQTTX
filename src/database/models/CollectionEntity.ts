import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

@Entity('CollectionEntity')
export default class CollectionEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id?: number

  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'integer', nullable: true, comment: 'order in the collection' })
  orderId!: number

  @Column({ type: 'boolean', default: true })
  isCollection!: true

  // current collection parent
  @ManyToOne(() => CollectionEntity, (collection) => collection.collection, { onDelete: 'CASCADE' })
  collection!: CollectionEntity[]

  // collections children
  @OneToMany(() => CollectionEntity, (collection) => collection.collection)
  collections!: CollectionEntity[]

  // connections children
  @OneToMany(() => ConnectionEntity, (connection) => connection.collection)
  connections!: ConnectionEntity[]
}
