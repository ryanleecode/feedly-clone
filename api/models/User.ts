import { sequenceS } from 'fp-ts/lib/Apply'
import { pipe } from 'fp-ts/lib/function'
import { option, Option, some, Some } from 'fp-ts/lib/Option'
import * as O from 'fp-ts/lib/Option'
import { Brand, make } from 'ts-brand'
import { Except } from 'type-fest'
import { Email, validate as validateEmail } from './Email'

export type UserId = Brand<string, 'User'>

export const UserId = make<UserId>()

export type User = {
  readonly id: Option<UserId>
  readonly email: Email
  readonly password: string
  readonly isActive: boolean
}

export type UserEntity = Except<User, 'id'> & {
  readonly id: Some<UserId>
}

export type NewUserInput = {
  readonly email: Email
  readonly password: string
}

// -----------------------------------------------------------------------------
// Factories
// -----------------------------------------------------------------------------

export type CreateUserEntityOperationInput = {
  readonly id: string
  readonly email: string
  readonly password: string
  readonly isActive: boolean
}

export type CreateUserEntityOperation = (
  input: CreateUserEntityOperationInput,
) => Option<UserEntity>

export const createUserEntity: CreateUserEntityOperation = (input) =>
  pipe(
    sequenceS(option)({
      id: some(UserId(input.id)),
      email: validateEmail(input.email),
      password: some(input.password),
      isActive: some(input.isActive),
    }),
    O.map((user) => ({ ...user, id: some(user.id) as Some<UserId> })),
  )
