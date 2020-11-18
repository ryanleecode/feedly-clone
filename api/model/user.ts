import { sequenceS } from 'fp-ts/lib/Apply'
import { unsafeCoerce } from 'fp-ts/lib/function'
import { option, Option, some } from 'fp-ts/lib/Option'
import * as O from 'fp-ts/lib/Option'
import { Email, is as isEmail } from './email'

export type UserBrand = {
  readonly User: unique symbol
}

export type UserId = string & UserBrand

export const UserId = (id: string): UserId => unsafeCoerce(id)

export type User = {
  readonly id: UserId
  readonly email: Email
  readonly password: string
  readonly isActive: boolean
}

export type NewUserInput = {
  readonly email: Email
  readonly password: string
}

export type CreateUserOperationInput = {
  readonly id: string
  readonly email: string
  readonly password: string
  readonly isActive: boolean
}

export type CreateUserOperation = (
  input: CreateUserOperationInput,
) => Option<User>

export const createUser: CreateUserOperation = (input) => {
  return sequenceS(option)({
    id: some(UserId(input.id)),
    email: O.fromPredicate(isEmail)(input.email),
    password: some(input.password),
    isActive: some(input.isActive),
  })
}
