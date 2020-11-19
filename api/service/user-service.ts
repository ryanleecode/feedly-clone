import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import * as I from 'fp-ts/lib/Identity'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-ESBST'
import * as t from 'io-ts'
import { CError, withCause, withMeta, of as CErrorOf } from '../cerror'
import { Email, UserId } from '../model'

export type SignUpOperationInput = {
  readonly email: Email
  readonly password: string
}

// eslint-disable-next-line @typescript-eslint/ban-types
const { summon, tagged } = summonFor<{}>({})

export const UnknownSignUpErrorM = summon((F) =>
  F.interface(
    {
      _type: F.stringLiteral('UnknownSignUpError'),
      value: CError(F),
    },
    'UnknownSignUpError',
  ),
)

export type UnknownSignUpError = t.TypeOf<typeof UnknownSignUpErrorM.type>

export const EmailTakenSignUpErrorM = summon((F) =>
  F.interface(
    {
      _type: F.stringLiteral('EmailTakenSignUpError'),
      value: CError(F),
    },
    'EmailTakenSignUpError',
  ),
)

export type EmailTakenSignUpError = t.TypeOf<typeof EmailTakenSignUpErrorM.type>

export const SignUpError = tagged('_type')({
  UnknownSignUpError: UnknownSignUpErrorM,
  EmailTakenSignUpError: EmailTakenSignUpErrorM,
})

export type SignUpError = t.TypeOf<typeof SignUpError.type>

export const UnknownSignUpError = (message: string) => (
  err: CError,
): UnknownSignUpError =>
  UnknownSignUpErrorM.build({
    _type: 'UnknownSignUpError',
    value: pipe(withCause(err), I.ap(CErrorOf(message))),
  })

export const EmailTakenSignUpError = (message: string) => (
  email: Email,
): EmailTakenSignUpError =>
  EmailTakenSignUpErrorM.build({
    _type: 'EmailTakenSignUpError',
    value: pipe(CErrorOf(message), withMeta({ info: { email } })),
  })

type TaskEither<A> = TE.TaskEither<SignUpError, A>

export type UserService = {
  readonly signUp: (input: SignUpOperationInput) => TaskEither<UserId>
}
