import * as TE from 'fp-ts/lib/TaskEither'
import * as D from 'io-ts/lib/Decoder'

const EnvDecoder = D.type({
  PORT: D.string,
})

export type Env = D.TypeOf<typeof EnvDecoder>

export function decode(): TE.TaskEither<D.DecodeError, Env> {
  return TE.fromEither(EnvDecoder.decode({ PORT: process.env.PORT }))
}
