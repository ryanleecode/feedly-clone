import * as t from 'io-ts'
import { eqObjectId } from '../mongodb/ObjectID'
import * as Eq from 'fp-ts/lib/Eq'
import { MongoJSONSchema4 } from 'mongodb-json-schema'
import { FeedSource } from './generated'
import { Schema } from './schema'

export type FeedSource = t.TypeOf<typeof FeedSource>

export { FeedSource }

export const eqFeedItem = Eq.contramap((i: FeedSource) => i._id)(eqObjectId)

type Properties = '_id' | 'fqdn'

export const schema: Schema<Properties> = {
  indices: [{ name: 'fqdn', unique: true }],
  $jsonSchema: {
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
  } as MongoJSONSchema4<Properties>,
}
