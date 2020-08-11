import * as D from 'io-ts/lib/Decoder'
import * as OID from '../mongodb/ObjectID'
import { Schemable2C } from 'io-ts/lib/Schemable'

export * from 'io-ts/lib/Decoder'

export const Schemable: Schemable2C<D.URI, unknown> = {
  ...D.Schemable,
  ObjectID: OID.decoder,
}
