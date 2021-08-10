import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Tree, TreeChildren, TreeParent } from 'typeorm'
import ConnectionEntity from './ConnectionEntity'

@Entity('CollectionEntity')
@Tree('closure-table')
export default class CollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  name!: string

  @Column({ type: 'integer', nullable: true, default: 0, comment: 'order in the collection' })
  orderId?: number

  @Column({ type: 'boolean', default: true })
  isCollection!: true

  // current collection parent
  @TreeParent()
  parent?: CollectionEntity

  // collections children
  @TreeChildren()
  collections!: CollectionEntity[]

  // connections children
  @OneToMany(() => ConnectionEntity, (connection) => connection.parent)
  connections!: ConnectionEntity[]
}
