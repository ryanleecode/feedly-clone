import * as O from 'fp-ts/lib/Option'
import * as E from 'fp-ts/lib/Either'
import * as mongodb from 'mongodb'
import * as t from 'io-ts'

import { withValidate, withMessage } from 'io-ts-types'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-ESBASTJ'
import { absurd, flow, identity, pipe, unsafeCoerce } from 'fp-ts/lib/function'
import * as IO from 'fp-ts/lib/IO'
import * as IOE from 'fp-ts/lib/IOEither'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export interface ObjectIDBrand {
  readonly ObjectID: unique symbol
}

export const ObjectID = t.brand(
  t.string,
  (s): s is t.Branded<string, ObjectIDBrand> =>
    O.isSome(O.tryCatch(() => new mongodb.ObjectID(s))),
  'ObjectID',
)

export type ObjectID = t.TypeOf<typeof ObjectID>

export const ObjectIDFromObjectIDProto = new t.Type<
  ObjectID,
  mongodb.ObjectID,
  unknown
>(
  'ObjectIDFromObjectIDProto',
  ObjectID.is,
  (u, c) =>
    u instanceof mongodb.ObjectID
      ? ObjectID.asDecoder().validate(u.toHexString(), c)
      : t.failure(u, c),
  (a) => new mongodb.ObjectID(a),
)

interface IoTsTypes {
  withValidate: typeof withValidate
  withMessage: typeof withMessage
  ObjectIDFromString: typeof ObjectIDFromObjectIDProto
}

type SummonConfig = {
  IoTsURI: IoTsTypes
}

const { summon } = summonFor<SummonConfig>({
  IoTsURI: {
    withValidate,
    withMessage,
    ObjectIDFromString: ObjectIDFromObjectIDProto,
  },
})

export const ObjectIDSummoner = summon((F) =>
  F.refined(F.string(), ObjectID.is, ObjectID.name, {
    IoTsURI: (_codec, env) =>
      pipe(env.withValidate(ObjectID, env.ObjectIDFromString.decode), (c) =>
        env.withMessage(
          c,
          (x) => `expected \"${x}\" to be an instance of mongodb.ObjectID`,
        ),
      ),
  }),
)

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export function of(): IO.IO<t.Branded<string, ObjectIDBrand>>
export function of(
  id?: string | number,
): IOE.IOEither<Error, t.Branded<string, ObjectIDBrand>>
export function of(
  id?: string | number,
):
  | IO.IO<t.Branded<string, ObjectIDBrand>>
  | IOE.IOEither<Error, t.Branded<string, ObjectIDBrand>> {
  if (id) {
    return pipe(
      IOE.tryCatch<Error, string>(
        () => new mongodb.ObjectID(id).toHexString(),
        unsafeCoerce,
      ),
      IOE.map(flow<[string], t.Branded<string, ObjectIDBrand>>(unsafeCoerce)),
    )
  } else {
    return pipe(
      new mongodb.ObjectID().toHexString(),
      flow<[string], t.Branded<string, ObjectIDBrand>>(unsafeCoerce),
      IO.of,
    )
  }
}
