import * as mongodb from 'mongodb'
import * as t from 'io-ts'

import { withMessage } from 'io-ts-types'
import { identity, unsafeCoerce } from 'fp-ts/lib/function'
import { Eq } from 'fp-ts/lib/Eq'
import * as IO from 'fp-ts/lib/IO'
import * as IOE from 'fp-ts/lib/IOEither'

export type ObjectID = t.TypeOf<typeof ObjectID>

export const ObjectID = withMessage(
  new t.Type<mongodb.ObjectID, mongodb.ObjectID, unknown>(
    'ObjectID',
    (u): u is mongodb.ObjectID => u instanceof mongodb.ObjectID,
    (u, c) => (u instanceof mongodb.ObjectID ? t.success(u) : t.failure(u, c)),
    identity,
  ),
  (x) => `expected \"${x}\" to be an instance of mongodb.ObjectID`,
)

export const eqObjectId: Eq<ObjectID> = {
  equals: (x, y) => x.equals(y),
}

export function of(): IO.IO<ObjectID>
export function of(id: string | number): IOE.IOEither<Error, ObjectID>
export function of(
  id?: string | number,
): IO.IO<ObjectID> | IOE.IOEither<Error, ObjectID> {
  if (id) {
    return IOE.tryCatch<Error, ObjectID>(
      () => new mongodb.ObjectID(id),
      unsafeCoerce,
    )
  } else {
    return IO.of(new mongodb.ObjectID())
  }
}
