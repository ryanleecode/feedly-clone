import { sequenceS } from 'fp-ts/lib/Apply'
import { constVoid, identity, not, pipe } from 'fp-ts/lib/function'
import { reader, Reader } from 'fp-ts/lib/Reader'
import * as TE from 'fp-ts/lib/TaskEither'
import { CError } from '../../cerror'
import { UserRepository } from '../../repository'
import {
  SignUpError,
  UnknownSignUpError,
  EmailTakenSignUpError,
  UserService,
} from '../user-service'

export type Deps = {
  readonly userRepository: UserRepository
}

type SignUp = Reader<Deps, UserService['signUp']>

const signUp: SignUp = ({ userRepository }) => (input) => {
  const { email } = input
  const validateNoUserWithEmailExists: TE.TaskEither<SignUpError, void> = pipe(
    userRepository.exists({ email }),
    TE.mapLeft<CError, SignUpError>(
      UnknownSignUpError(
        `Cannot determine whether user with email: ${email} exists`,
      ),
    ),
    TE.chain(
      TE.fromPredicate<SignUpError, boolean>(not(identity), () =>
        EmailTakenSignUpError(`User with email: ${email} is taken`)(email),
      ),
    ),
    TE.map(constVoid),
  )

  return pipe(
    validateNoUserWithEmailExists,
    TE.chain(() =>
      pipe(
        userRepository.create(input),
        TE.mapLeft<CError, SignUpError>(
          UnknownSignUpError('Failed to sign up user'),
        ),
      ),
    ),
  )
}

export const UserServiceReader: Reader<Deps, UserService> = sequenceS(reader)({
  signUp,
})
