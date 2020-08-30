import { PrismaClient } from '@prisma/client'
import { constVoid, flow, pipe, unsafeCoerce } from 'fp-ts/lib/function'
import { Reader } from 'fp-ts/lib/Reader'
import { UserRepository } from '../UserRepository'
import { v4 as uuid } from 'uuid'
import { createUserEntity, NewUserInput, UserId } from '../../models/User'
import * as TE from 'fp-ts/lib/TaskEither'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import { Do } from 'fp-ts-contrib/lib/Do'
import * as O from 'fp-ts/lib/Option'

export interface PasswordService {
  readonly hash: (value: string) => TE.TaskEither<Error, string>
}

export type Deps = {
  db: PrismaClient
  passwordService: PasswordService
}

export const create: Reader<Deps, UserRepository['create']> = (deps) => {
  return (user: NewUserInput) =>
    pipe(
      Do(TE.taskEither)
        .bind('hashedPassword', deps.passwordService.hash(user.password))
        .doL(({ hashedPassword }) => {
          const id = UserId(uuid())
          const input = {
            email: user.email,
            password: hashedPassword,
            isActive: false,
          }

          return TE.tryCatch(
            () =>
              deps.db.user.upsert({
                create: { ...input, id },
                update: input,
                where: { id },
              }),
            flow<unknown[], Error>(unsafeCoerce),
          )
        })
        .return(() => constVoid()),
      ObE.fromTaskEither,
    )
}

export const exists: Reader<Deps, UserRepository['exists']> = (deps) => {
  return (email) =>
    pipe(
      TE.tryCatch(
        () => deps.db.user.count({ where: { email } }),
        flow<unknown[], Error>(unsafeCoerce),
      ),
      TE.map((count) => count > 0),
      ObE.fromTaskEither,
    )
}

export const findOneByEmail: Reader<Deps, UserRepository['findOneByEmail']> = (
  deps,
) => (email) =>
  pipe(
    TE.tryCatch(
      () => deps.db.user.findOne({ where: { email } }),
      flow<unknown[], Error>(unsafeCoerce),
    ),
    TE.map(O.fromNullable),
    TE.map(O.chain(createUserEntity)),
    ObE.fromTaskEither,
  )
