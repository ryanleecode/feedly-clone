import * as Eq from 'io-ts/lib/Eq'
import * as G from 'io-ts/lib/Guard'
import * as S from 'io-ts/lib/Schema'
import * as D from '../io-ts/Decoder'

const FeedItem = S.make((F) =>
  F.type({
    _id: F.ObjectID,
    title: F.string,
  }),
)

export const decoder = S.interpreter(D.Schemable)(FeedItem)
export const guardPerson = S.interpreter(G.Schemable)(FeedItem)
export const eqPerson = S.interpreter(Eq.Schemable)(FeedItem)
