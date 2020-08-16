import * as t from 'io-ts'
import { ObjectID } from '../../mongodb/ObjectID'

export const FeedItem = t.exact(
  t.intersection([
    t.type({
      _id: ObjectID,
      title: t.string,
      link: t.string,
      date: t.unknown,
    }),
    t.partial({
      description: t.string,
    }),
  ]),
)

export const FeedSource = t.exact(
  t.type({
    _id: ObjectID,
    fqdn: t.string,
  }),
)
