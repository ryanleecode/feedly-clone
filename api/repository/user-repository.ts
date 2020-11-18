import * as TE from 'fp-ts/lib/TaskEither'
import { CError } from '../cerror'
import { Email } from '../model'
import { NewUserInput, UserId } from '../model/user'

type TaskEither<A> = TE.TaskEither<CError, A>

export type CreateUserOperation = (user: NewUserInput) => TaskEither<UserId>

export type UserExistsInput = {
  readonly id?: UserId
  readonly email?: Email
}

export type UserExistsOperation = (
  input: UserExistsInput,
) => TaskEither<boolean>

export interface UserRepository {
  readonly create: CreateUserOperation
  readonly exists: UserExistsOperation
}
