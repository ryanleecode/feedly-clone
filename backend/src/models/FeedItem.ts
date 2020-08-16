import { eqObjectId, ObjectID } from '../mongodb/ObjectID'
import { DateFromISOString } from 'io-ts-types'
import * as t from 'io-ts'
import * as Eq from 'fp-ts/lib/Eq'
import { MongoJSONSchema4 } from 'mongodb-json-schema'
// import { FeedItem } from './generated'

export type FeedItem = t.TypeOf<typeof FeedItem>

export const FeedItem = t.exact(
  t.intersection([
    t.type({
      _id: ObjectID,
      title: t.string,
      link: t.string,
      date: DateFromISOString,
    }),
    t.partial({
      description: t.string,
    }),
  ]),
)

/* export { FeedItem } */

export const eqFeedItem = Eq.contramap((i: FeedItem) => i._id)(eqObjectId)

export const schema: MongoJSONSchema4 = {
  title: 'FeedSource',
  bsonType: 'object',
  additionalProperties: false,
  required: ['_id', 'title', 'link', 'date'],
  properties: {
    _id: {
      bsonType: 'objectId',
    },
    title: {
      bsonType: 'string',
    },
    link: {
      bsonType: 'string',
    },
    date: {
      bsonType: 'date',
    },
    description: {
      bsonType: 'string',
    },
  },
}
