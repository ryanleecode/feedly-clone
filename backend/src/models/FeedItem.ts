import { eqObjectId, ObjectID } from '../mongodb/ObjectID'
import { date } from 'io-ts-types'
import * as t from 'io-ts'
import * as Eq from 'fp-ts/lib/Eq'
import { MongoJSONSchema4 } from 'mongodb-json-schema'
import { Schema } from './schema'
// import { FeedItem } from './generated'

export type FeedItem = t.TypeOf<typeof FeedItem>

export const FeedItem = t.exact(
  t.intersection([
    t.type({
      _id: ObjectID,
      title: t.string,
      fqdn: t.string,
      date,
    }),
    t.partial({
      description: t.string,
    }),
  ]),
)

/* export { FeedItem } */

export const eqFeedItem = Eq.contramap((i: FeedItem) => i._id)(eqObjectId)

type Properties = '_id' | 'title' | 'fqdn' | 'date' | 'description'

export const schema: Schema<Properties> = {
  $jsonSchema: {
    title: 'FeedSource',
    bsonType: 'object',
    additionalProperties: false,
    required: ['_id', 'title', 'fqdn', 'date'] as Properties[],
    properties: {
      _id: {
        bsonType: 'objectId',
      },
      title: {
        bsonType: 'string',
      },
      fqdn: {
        bsonType: 'string',
      },
      date: {
        bsonType: 'date',
      },
      description: {
        bsonType: 'string',
      },
    },
  } as MongoJSONSchema4<Properties>,
}
