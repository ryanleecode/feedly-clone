import * as R from 'fp-ts/lib/Reader'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import * as I from 'fp-ts/lib/Identity'
import { flow, pipe } from 'fp-ts/lib/function'
import { Reader } from 'fp-ts/lib/Reader'
import { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import { sequenceS } from 'fp-ts/lib/Apply'
import { UserRepository } from '../user-repository'
import { UserId } from '../../model'
import { PasswordService } from '../../app/service'
import { withCause, withMeta, of as CErrorOf } from '../../cerror'

export type Deps = {
  readonly db: PrismaClient
  readonly passwordService: PasswordService
}

type Create = Reader<Deps, UserRepository['create']>

const create: Create = ({ db, passwordService }) => (input) => {
  return pipe(
    TE.bindTo('hashedPassword')(
      pipe(
        passwordService.hash(input.password),
        TE.mapLeft(flow(withCause, I.ap(CErrorOf('Failed to hash password')))),
      ),
    ),
    TE.bind('userId', () => TE.of(UserId(uuid()))),
    TE.bind('user', ({ hashedPassword, userId: id }) =>
      TE.of({
        id,
        email: input.email,
        password: hashedPassword,
        isActive: false,
      }),
    ),
    TE.chainFirst(({ user }) =>
      pipe(
        TE.tryCatch(() => db.user.create({ data: user }), E.toError),
        TE.mapLeft(
          flow(withCause, I.ap(CErrorOf('Failed to insert user into db'))),
        ),
      ),
    ),
    TE.map(({ userId }) => userId),
  )
}

type Exists = Reader<Deps, UserRepository['exists']>

const exists: Exists = ({ db }) => ({ email, id }) => {
  return pipe(
    TE.tryCatch(() => db.user.count({ where: { email, id } }), E.toError),
    TE.mapLeft(
      flow(
        withCause,
        I.ap(CErrorOf(`Failed to check if user with email ${email} exists`)),
        withMeta({ email, id }),
      ),
    ),
    TE.map((count) => count > 0),
  )
}

export const UserRepositoryReader = sequenceS(R.reader)({
  create,
  exists,
})
