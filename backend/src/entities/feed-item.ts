import { withValidate } from 'io-ts-types'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-ESBASTJ'
import { ObjectID } from '../mongodb/ObjectID'

/* const FeedItem = S.make((F) =>
  F.type({
    _id: F.ObjectID,
    title: F.string,
  }),
) */

interface IoTsTypes {
  withValidate: typeof withValidate
}

type SummonConfig = {
  IoTsURI: IoTsTypes
}

const { summon } = summonFor<SummonConfig>({
  IoTsURI: { withValidate },
})

const FeedItem = summon((F) =>
  F.interface(
    {
      _id: F.string({ IoTsURI: (codec, env) => env.withValidate(ObjectID) }),
      title: F.string(),
    },
    'FeedItem',
  ),
)
