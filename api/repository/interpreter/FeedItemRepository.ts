import { flow, pipe, unsafeCoerce } from 'fp-ts/lib/function'
import { Reader } from 'fp-ts/lib/Reader'
import { FeedItemRepository } from '../FeedItemRepository'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import * as O from 'fp-ts/lib/Option'
import * as TE from 'fp-ts/lib/TaskEither'
import { v4 as uuid } from 'uuid'
import { FeedItemId } from '../../models/FeedItem'
import { PrismaClient } from '@prisma/client'

export type Deps = {
  db: PrismaClient
}

export const save: Reader<Deps, FeedItemRepository['save']> = (deps) => {
  return (item) => {
    const id = FeedItemId(O.toNullable(item.id) ?? uuid())

    const input = {
      title: item.title,
      link: item.link,
      date: item.date,
      content: O.toNullable(item.content),
      author: O.toNullable(item.author),
      image: O.toNullable(item.image),
      feedSources: {
        connect: {
          id: item.feedSourceId,
        },
      },
    }

    return pipe(
      TE.tryCatch(
        () =>
          deps.db.feedItem.upsert({
            create: { ...input, id },
            update: input,
            where: { id },
          }),
        flow<unknown[], Error>(unsafeCoerce),
      ),
      TE.map(() => ({ ...item, id: O.some(id) as O.Some<FeedItemId> })),
      ObE.fromTaskEither,
    )
  }
}
