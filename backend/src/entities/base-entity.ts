import { EntitySchema, MongoEntity } from 'mikro-orm'
import { ObjectID } from 'mongodb'

export interface BaseEntity extends MongoEntity<{ _id: ObjectID; id: string }> {
  createdAt: Date
  updatedAt: Date
}

export const schema = new EntitySchema<BaseEntity>({
  name: 'BaseEntity',
  abstract: true,
  properties: {
    _id: { type: 'ObjectID', primary: true },
    id: { type: 'string', serializedPrimaryKey: true },
    createdAt: { type: 'Date', onCreate: () => new Date(), nullable: true },
    updatedAt: {
      type: 'Date',
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
      nullable: true,
    },
  },
})
