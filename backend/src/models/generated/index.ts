import * as t from 'io-ts'
import { date } from 'io-ts-types'
import { ObjectID } from '../../mongodb/ObjectID'

export const FeedItem = t.exact(
  t.intersection([
    t.type({
      _id: ObjectID,
      feed_source_id: ObjectID,
      title: t.string,
      link: t.string,
      date: date,
    }),
    t.partial({
      content: t.unknown,
      author: t.unknown,
      image: t.unknown,
    }),
  ]),
)

export const FeedSource = t.exact(
  t.type({
    _id: ObjectID,
    url: t.string,
  }),
)
