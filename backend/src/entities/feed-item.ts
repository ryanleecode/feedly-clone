import { EntitySchema } from 'mikro-orm'
import { BaseEntity } from './base-entity'

export interface FeedItem extends BaseEntity {
  fqdn: string
}

export const schema = new EntitySchema<FeedItem, BaseEntity>({
  name: 'FeedItem',
  extends: 'BaseEntity',
  properties: {
    fqdn: { type: 'string' },
  },
})
