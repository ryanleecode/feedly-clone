import {
  FieldResolver,
  inputObjectType,
  interfaceType,
  objectType,
  unionType,
} from '@nexus/schema'
import * as D from 'io-ts/lib/Decoder'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import { NexusGenRootTypes } from 'nexus-typegen'
import { flow, pipe } from 'fp-ts/lib/function'
import * as Email from '../model/email'
import { UserId } from '../model'
import { SignUpError as UserSignUpError } from '../service'
import { getLogger } from '../log'
import { handleError } from '../util'
import { mapDecoderError } from './validation'

export const SignUpInput = inputObjectType({
  name: 'SignupInput',
  definition(t) {
    t.string('email')
    t.string('password')
  },
  nonNullDefaults: { input: true },
})

export const SignUpPayload = objectType({
  name: 'SignUpPayload',
  definition(t) {
    t.string('userId')
    t.list.field('errors', { type: 'SignUpError', nullable: false })
  },
})

export const SignUpErrors = unionType({
  name: 'SignUpErrors',
  definition(t) {
    t.members(
      'SignUpInvalidInputError',
      'SignUpUserAlreadyExistsError',
      'SignUpUserUnknownError',
    )
  },
})

export const SignUpError = interfaceType({
  name: 'SignUpError',
  definition(t) {
    t.string('message')
    t.list.string('meta')
  },
  nonNullDefaults: { input: true, output: true },
})

export const SignUpInvalidInputError = objectType({
  name: 'SignUpInvalidInputError',
  definition(t) {
    t.implements('SignUpError', 'ValidationError')
  },
})

export const SignUpUserAlreadyExistsError = objectType({
  name: 'SignUpUserAlreadyExistsError',
  definition(t) {
    t.implements('SignUpError')
  },
})

export const SignUpUserUnknownError = objectType({
  name: 'SignUpUserUnknownError',
  definition(t) {
    t.implements('SignUpError')
  },
})

export const SignUpInputDecoder = D.type({
  email: Email.decoder,
  password: D.string,
})

export const types = [
  SignUpInput,
  SignUpInvalidInputError,
  SignUpUserAlreadyExistsError,
  SignUpUserUnknownError,
  SignUpError,
  SignUpErrors,
  SignUpPayload,
]

type SignUp = FieldResolver<'Mutation', 'signUp'>
type SignUpErrors = NexusGenRootTypes['SignUpErrors']
type SignUpPayload = NexusGenRootTypes['SignUpPayload']

const NewSignUpInvalidInputError = (message: string) => (
  // eslint-disable-next-line functional/prefer-readonly-type
  errors: string[],
): SignUpErrors => ({
  __typename: 'SignUpInvalidInputError',
  message,
  meta: [],
  errors,
})

const NewSignUpUnknownError = (): SignUpErrors => ({
  __typename: 'SignUpUserUnknownError',
  message: 'An unknown error occurred.',
  meta: [],
})

const NewSignUpUserAlreadyExistsError = ({
  message,
  meta = [],
}: {
  readonly message: string
  // eslint-disable-next-line functional/prefer-readonly-type
  meta: string[]
}) => (): SignUpErrors => ({
  __typename: 'SignUpUserAlreadyExistsError',
  message,
  meta,
})

const logger = getLogger('feedly_clone::schema::sign-up')

export const signUp: SignUp = (root, { input: unknownInput }, ctx) => {
  return pipe(
    E.bindTo('input')(SignUpInputDecoder.decode(unknownInput)),
    E.mapLeft(
      flow(mapDecoderError, NewSignUpInvalidInputError('Input is invalid')),
    ),
    TE.fromEither,
    TE.bindW('userId', ({ input }) =>
      pipe(
        ctx.userService.signUp(input),
        handleError(
          UserSignUpError.matchStrict({
            UnknownSignUpError: (err) =>
              pipe(logger.error('Failed to sign up user', err.value), (io) =>
                TE.fromIO(io),
              ),
            EmailTakenSignUpError: TE.left,
          }),
        ),
        TE.mapLeft(
          UserSignUpError.match(
            {
              EmailTakenSignUpError: NewSignUpUserAlreadyExistsError({
                message: 'A user with this email already exists',
                meta: [input.email],
              }),
            },
            NewSignUpUnknownError,
          ),
        ),
      ),
    ),
    TE.map(({ userId }) => userId),
    TE.fold<SignUpErrors, UserId, SignUpPayload>(
      (err) =>
        T.of({
          errors: [err],
        }),
      (userId) =>
        T.of({
          userId,
          errors: [],
        }),
    ),
  )()
}
