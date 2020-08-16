import * as mongodb from 'mongodb'
import * as t from 'io-ts'
import { withMessage } from 'io-ts-types'
import { identity, unsafeCoerce } from 'fp-ts/lib/function'
import { Eq } from 'fp-ts/lib/Eq'
import * as IO from 'fp-ts/lib/IO'
import * as E from 'fp-ts/lib/Either'

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

export function create(): IO.IO<ObjectID>
export function create(id: string | number): E.Either<Error, ObjectID>
export function create(
  id?: string | number,
): IO.IO<ObjectID> | E.Either<Error, ObjectID> {
  if (id) {
    return E.tryCatch<Error, ObjectID>(
      () => new mongodb.ObjectID(id),
      unsafeCoerce,
    )
  } else {
    return () => new mongodb.ObjectID()
  }
}

export const isValid = mongodb.ObjectID.isValid

export function timestamp(objectId: ObjectID): Date {
  return objectId.getTimestamp()
}

export function hexString(objectId: ObjectID): string {
  return objectId.toHexString()
}
