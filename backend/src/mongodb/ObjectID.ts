import * as O from 'fp-ts/lib/Option'
import * as mongodb from 'mongodb'
import * as t from 'io-ts'

import { withValidate, withMessage } from 'io-ts-types'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-ESBASTJ'
import { pipe } from 'fp-ts/lib/function'

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

// -- morphic-ts

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
