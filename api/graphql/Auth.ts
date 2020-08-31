import { pipe } from 'fp-ts/lib/function'
import { schema } from 'nexus'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'

import * as D from 'io-ts/lib/Decoder'

import * as Email from '../models/Email'
import { Tree } from 'fp-ts/lib/Tree'
import { Concat, Of } from 'io-ts/lib/FreeSemigroup'
import { DecodeError } from 'io-ts/lib/DecodeError'

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Signup
// -----------------------------------------------------------------------------

export const SignupInput = schema.inputObjectType({
  name: 'SignupInput',
  definition(t) {
    t.string('email')
    t.string('password')
  },
  nonNullDefaults: { input: true },
})

export const SignupValidationError = schema.objectType({
  name: 'SignupValidationError',
  definition(t) {
    t.string('errors', { list: true })
  },
})

export const SignupError = schema.objectType({
  name: 'SignupError',
  definition(t) {
    t.string('error')
  },
})

export const SignupOutput = schema.unionType({
  name: 'SignupOutput',
  definition(t) {
    t.members('SignupValidationError', 'SignupError')
    t.resolveType((obj) => {
      if ('errors' in obj) {
        return 'SignupValidationError'
      }
      return 'SignupError'
    })
  },
})

const SignupInputDecoder = D.type({
  email: Email.decoder,
  password: D.string,
})

function getErrorValues(forest: Array<Tree<string>>): Array<string> {
  return forest.flatMap((x) => {
    return x.forest.length ? [x.value, ...getErrorValues(x.forest)] : [x.value]
  })
}

const ErrorInterpreter = (
  err: Of<DecodeError<string>> | Concat<DecodeError<string>> | Error,
) => {
  if (err instanceof Error) {
  }
}

schema.extendType({
  type: 'Mutation',
  definition(t) {
    t.field('signup', {
      type: 'SignupOutput',
      args: {
        input: SignupInput,
      },
      resolve(_root, { input }, ctx) {
        const { userService } = ctx

        return pipe(
          SignupInputDecoder.decode(input),
          TE.fromEither,
          TE.chainW((input) =>
            pipe(
              userService.signup({
                email: input.email,
                password: input.password,
              }),
              ObE.toTaskEither,
            ),
          ),
          TE.fold(
            (e) => T.of({ errors: [D.draw(e as any)] }),
            () => T.of({ errors: [] }),
          ),
        )()
      },
    })
  },
})

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------

export const LoginInput = schema.inputObjectType({
  name: 'LoginInput',
  definition(t) {
    t.string('email')
    t.string('password')
  },
  nonNullDefaults: { input: true },
})

export const LoginOutput = schema.objectType({
  name: 'LoginOutput',
  definition(t) {
    t.string('token')
  },
})

const LoginInputDecoder = D.type({
  email: Email.decoder,
  password: D.string,
})

schema.extendType({
  type: 'Mutation',
  definition(t) {
    t.field('login', {
      type: LoginOutput,
      args: {
        input: LoginInput,
      },
      resolve(_root, { input }, ctx) {
        pipe(LoginInputDecoder.decode(input))
        // ctx.userService.login(input)
        return {}
      },
    })
  },
})
