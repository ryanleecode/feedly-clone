import * as t from 'io-ts'
import { eqObjectId } from '../mongodb/ObjectID'
import * as Eq from 'fp-ts/lib/Eq'
import { MongoJSONSchema4 } from 'mongodb-json-schema'
import { FeedSource as gFeedSource } from './generated'
import { Schema } from './schema'

export type FeedSource = t.TypeOf<typeof gFeedSource>

export const FeedSource = gFeedSource

export const eqFeedItem = Eq.contramap((i: FeedSource) => i._id)(eqObjectId)

type Properties = '_id' | 'url'

export const schema: Schema<Properties> = {
  indices: [{ name: 'url', unique: true }],
  $jsonSchema: {
    title: 'FeedSource',
    bsonType: 'object',
    additionalProperties: false,
    required: ['_id', 'url'],
    properties: {
      _id: {
        bsonType: 'objectId',
      },
      url: {
        bsonType: 'string',
      },
    },
  } as MongoJSONSchema4<Properties>,
}
