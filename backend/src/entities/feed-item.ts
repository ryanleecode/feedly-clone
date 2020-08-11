import * as D from 'io-ts/lib/Decoder'
import * as Eq from 'io-ts/lib/Eq'
import * as G from 'io-ts/lib/Guard'
import * as S from 'io-ts/lib/Schema'
import * as TD from 'io-ts/lib/TaskDecoder'
import * as OID from '../mongodb/ObjectID'

const FeedItem = OID.make((F) =>
  F.type({
    _id: F.ObjectID,
    title: F.string,
  }),
)

export const decoder = OID.interpreter(OID.Schemable)(FeedItem)
export const guardPerson = OID.interpreter(G.Schemable)(FeedItem)
export const eqPerson = OID.interpreter(Eq.Schemable)(FeedItem)
