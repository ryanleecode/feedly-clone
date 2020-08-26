import { sequenceS } from 'fp-ts/lib/Apply'

import * as R from 'fp-ts/lib/Reader'
import { QueryResolvers } from '../generated/graphql'

const hello: R.Reader<string, NonNullable<QueryResolvers['hello']>> = (
  a: string,
) => {
  return (obj) => {
    return 'asdf'
  }
}

export const yolo = sequenceS(R.reader)({
  Query: sequenceS(R.reader)({
    hello,
  }),
})
