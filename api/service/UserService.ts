import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { flow, pipe } from 'fp-ts/lib/function'
import { Reader } from 'fp-ts/lib/Reader'
import { UserRepository } from '../repository/UserRepository'
import { Email } from '../models/Email'
import * as TE from 'fp-ts/lib/TaskEither'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'

export type Deps = {
  userRepository: UserRepository
}

// -----------------------------------------------------------------------------
// Signup
// -----------------------------------------------------------------------------

export type SignupOperationInput = {
  email: Email
  password: string
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

export type LoginOperationInput = {
  email: Email
  password: string
}

export type LoginOperation = (
  input: LoginOperationInput,
) => ObservableEither<Error, unknown>

// export const login: Reader<Deps, LoginOperation> = () => {}
