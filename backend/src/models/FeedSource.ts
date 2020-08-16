import * as t from 'io-ts'
import { eqObjectId } from '../mongodb/ObjectID'
import * as Eq from 'fp-ts/lib/Eq'
import { MongoJSONSchema4 } from 'mongodb-json-schema'
import { FeedSource } from './generated'

export type FeedSource = t.TypeOf<typeof FeedSource>

export { FeedSource }

export const eqFeedItem = Eq.contramap((i: FeedSource) => i._id)(eqObjectId)

export const schema: MongoJSONSchema4 = {
  title: 'FeedSource',
  bsonType: 'object',
  additionalProperties: false,
  required: ['_id', 'fqdn'],
  properties: {
    _id: {
      bsonType: 'objectId',
    },
    fqdn: {
      bsonType: 'string',
    },
  },
}
