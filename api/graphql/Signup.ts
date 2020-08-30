import { constVoid, pipe } from 'fp-ts/lib/function'
import { schema } from 'nexus'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import { sequenceS } from 'fp-ts/lib/Apply'
import * as Email from '../models/Email'

export const SignupInput = schema.inputObjectType({
  name: 'SignupInput',
  definition(t) {
    t.string('email')
    t.string('password')
  },
  nonNullDefaults: { input: true },
})

schema.mutationType({
  nonNullDefaults: {
    input: true,
    output: true,
  },
  definition(t) {
    t.field('signup', {
      type: 'Boolean',
      args: {
        input: SignupInput,
      },
      resolve(_root, { input }, ctx) {
        const { userService } = ctx

        return pipe(
          Email.validate(input.email),
          TE.fromOption(() => new Error('email is invalid')),
          ObE.fromTaskEither,
          ObE.chain((validatedEmail) =>
            userService.signup({
              email: validatedEmail,
              password: input.password,
            }),
          ),
          ObE.toTaskEither,
          TE.fold(
            () => T.of(false),
            () => T.of(true),
          ),
        )()
      },
    })
  },
})
