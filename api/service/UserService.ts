import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { Reader } from 'fp-ts/lib/Reader'
import { UserRepository } from '../repository/UserRepository'
import { Email } from '../models/Email'
import { UserEntity } from '../models/User'
import { flow, pipe } from 'fp-ts/lib/function'
import { Except } from 'type-fest'

import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'

export type Deps = {
  readonly userRepository: UserRepository
}

// -----------------------------------------------------------------------------
// Signup
// -----------------------------------------------------------------------------

export type SignupOperationInput = {
  readonly email: Email
  readonly password: string
}

export type SignupOperation = (
  input: SignupOperationInput,
) => ObservableEither<Error, void>

export const signup: Reader<Deps, SignupOperation> = ({ userRepository }) => {
  return (input) =>
    userRepository.create({
      email: input.email,
      password: input.password,
    })
}

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------

export type UserDoesNotExistLoginError = {
  readonly _tag: 'UserDoesNotExistLoginError'
  readonly email: string
}

const UserDoesNotExistLoginError = ({
  email,
}: Except<UserDoesNotExistLoginError, '_tag'>): UserDoesNotExistLoginError => ({
  _tag: 'UserDoesNotExistLoginError',
  email,
})

export type UserBadPasswordLoginError = {
  readonly _tag: 'UserBadPasswordLoginError'
  readonly email: string
}

const UserBadPasswordLoginError = ({
  email,
}: Except<UserBadPasswordLoginError, '_tag'>): UserBadPasswordLoginError => ({
  _tag: 'UserBadPasswordLoginError',
  email,
})

export type LoginError =
  | UserDoesNotExistLoginError
  | UserBadPasswordLoginError
  | Error

export type LoginOperationInput = {
  readonly email: Email
  readonly password: string
}

export type LoginOperation = (
  input: LoginOperationInput,
) => ObservableEither<LoginError, UserEntity>

export const login: Reader<Deps, LoginOperation> = ({ userRepository }) => {
  return ({ email }) =>
    pipe(
      userRepository.findOneByEmail(email),
      ObE.toTaskEither,
      TE.chainW(
        flow(
          E.fromOption(() => UserDoesNotExistLoginError({ email: email })),
          TE.fromEither,
        ),
      ),
      ObE.fromTaskEither,
    )
}
