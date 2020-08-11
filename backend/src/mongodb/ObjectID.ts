import { Kind2, URIS2, HKT } from 'fp-ts/lib/HKT'
import * as S from 'io-ts/lib/Schemable'
import * as D from 'io-ts/lib/Decoder'
import { pipe } from 'fp-ts/lib/function'
import * as mongodb from 'mongodb'

export interface ObjectIDBrand {
  readonly ObjectID: unique symbol
}

export type ObjectID = string & ObjectIDBrand

export const decoder = pipe(
  D.fromRefinement(
    (u): u is mongodb.ObjectID => u instanceof mongodb.ObjectID,
    'ObjectID',
  ),
  D.map((id) => id.toHexString()),
  D.refine((id): id is ObjectID => !!id, 'ObjectID'),
)

export const URI = 'ObjectID'

export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly [URI]: S.Schemable<A>
  }
}

declare module 'io-ts/lib/Schemable' {
  export interface Schemable<S> {
    readonly ObjectID: HKT<S, ObjectID>
  }

  export interface Schemable2C<S extends URIS2, E> {
    readonly ObjectID: Kind2<S, unknown, ObjectID>
  }
}
