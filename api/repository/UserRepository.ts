import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { Option } from 'fp-ts/lib/Option'
import { Email } from '../models/Email'
import { NewUserInput, UserEntity } from '../models/User'

export interface UserRepository {
  readonly create: (user: NewUserInput) => ObservableEither<Error, void>
  readonly exists: (email: Email) => ObservableEither<Error, boolean>
  readonly findOneByEmail: (
    email: Email,
  ) => ObservableEither<Error, Option<UserEntity>>
}
