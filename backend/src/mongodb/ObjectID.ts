import * as C from 'io-ts/lib/Codec'
import * as D from 'io-ts/lib/Decoder'
import * as E from 'io-ts/lib/Encoder'
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

const encoder: E.Encoder<mongodb.ObjectID, ObjectID> = {
  encode: (a) => new mongodb.ObjectID(a),
}

export const ObjectID: C.Codec<unknown, mongodb.ObjectID, ObjectID> = C.make(
  decoder,
  encoder,
)
