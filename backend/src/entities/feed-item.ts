import { withValidate, withMessage } from 'io-ts-types'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-ESBASTJ'
import {
  ObjectIDFromObjectIDProto,
  ObjectIDSummoner,
} from '../mongodb/ObjectID'
import * as E from 'fp-ts/lib/Either'
import * as mongodb from 'mongodb'
import { flow, pipe } from 'fp-ts/lib/function'
import util from 'util'
import { formatValidationErrors } from 'io-ts-reporters'

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

const FeedItem = summon((F) =>
  F.interface(
    {
      _id: ObjectIDSummoner(F),
      title: F.string(),
    },
    'FeedItem',
  ),
)

pipe(
  FeedItem.type.decode({
    _id: '5f31f22918b5a6853a74912d',
    title: 'asdf',
  }),
  E.fold(
    flow(
      formatValidationErrors,
      (a) => util.inspect(a, { depth: null }),
      console.log,
    ),
    flow((a) => util.inspect(a), console.log),
  ),
)
