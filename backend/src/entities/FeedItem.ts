import { eqObjectId, ObjectID } from '../mongodb/ObjectID'
import { DateFromISOString } from 'io-ts-types'
import * as t from 'io-ts'
import * as Eq from 'fp-ts/lib/Eq'

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

export const eqFeedItem = Eq.contramap((i: FeedItem) => i._id)(eqObjectId)
