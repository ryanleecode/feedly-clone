import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import * as I from 'fp-ts/lib/Identity'
import { ADT } from '../adt'
import { CError, withCause, withMeta, of as CErrorOf } from '../cerror'
import { Email, UserId } from '../model'

export type SignUpOperationInput = {
  readonly email: Email
  readonly password: string
}

export type SignUpError = ADT<{
  readonly UnknownSignUpError: { readonly value: CError }
  readonly EmailTakenSignUpError: {
    readonly value: CError
  }
}>

type ExtractedSignUpError<A> = Extract<SignUpError, A>

export type UnknownSignUpError = ExtractedSignUpError<{
  readonly _type: 'UnknownSignUpError'
}>
export type EmailTakenSignUpError = ExtractedSignUpError<{
  readonly _type: 'EmailTakenSignUpError'
}>

export const UnknownSignUpError = (message: string) => (
  err: CError,
): UnknownSignUpError => ({
  _type: 'UnknownSignUpError',
  value: pipe(withCause(err), I.ap(CErrorOf(message))),
})

export const EmailTakenSignUpError = (message: string) => (
  email: Email,
): EmailTakenSignUpError => ({
  _type: 'EmailTakenSignUpError',
  value: pipe(CErrorOf(message), withMeta({ info: { email } })),
})

type TaskEither<A> = TE.TaskEither<SignUpError, A>

export type UserService = {
  readonly signUp: (input: SignUpOperationInput) => TaskEither<UserId>
}
