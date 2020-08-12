import * as t from 'io-ts'
import { ObjectID } from '../mongodb/ObjectID'

export const FeedSource = t.exact(
  t.type({
    _id: ObjectID,
  }),
)
