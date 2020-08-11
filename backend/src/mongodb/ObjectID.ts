import { Kind2, URIS2, URIS, HKT } from 'fp-ts/lib/HKT'
import * as S from 'io-ts/lib/Schemable'
import * as D from 'io-ts/lib/Decoder'
import { pipe } from 'fp-ts/lib/function'
import * as mongodb from 'mongodb'

export interface ObjectIDBrand {
  readonly ObjectID: unique symbol
}

export type ObjectID = string & ObjectIDBrand

export interface ObjectIDSchemable<S> extends S.Schemable<S> {
  readonly ObjectID: HKT<S, ObjectID>
}

export interface ObjectIDSchemable2C<S extends URIS2>
  extends S.Schemable2C<S, unknown> {
  readonly ObjectID: Kind2<S, unknown, ObjectID>
}

export interface ObjectIDSchema<A> {
  <S>(S: ObjectIDSchemable<S>): HKT<S, A>
}

export function make<A>(f: ObjectIDSchema<A>): ObjectIDSchema<A> {
  return S.memoize(f)
}

export const Schemable: ObjectIDSchemable2C<D.URI> = {
  ...D.Schemable,
  ObjectID: pipe(
    D.fromRefinement(
      (u): u is mongodb.ObjectID => u instanceof mongodb.ObjectID,
      'ObjectID',
    ),
    D.map((id) => id.toHexString()),
    D.refine((id): id is ObjectID => !!id, 'ObjectID'),
  ),
}

export function interpreter<S extends URIS2>(
  S: ObjectIDSchemable2C<S>,
): <A>(schema: ObjectIDSchema<A>) => Kind2<S, unknown, A>
export function interpreter<S>(
  S: ObjectIDSchemable<S>,
): <A>(schema: ObjectIDSchema<A>) => HKT<S, A> {
  return (schema) => schema(S)
}

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

export const URI = 'ObjectID'

export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly [URI]: ObjectIDSchema<A>
  }
  interface URItoKind2<E, A> {
    readonly [URI]: ObjectIDSchema<A>
  }
}
