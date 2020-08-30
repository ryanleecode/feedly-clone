import { flow, pipe, unsafeCoerce } from 'fp-ts/lib/function'
import { Reader } from 'fp-ts/lib/Reader'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import * as O from 'fp-ts/lib/Option'
import * as TE from 'fp-ts/lib/TaskEither'
import * as A from 'fp-ts/lib/Array'
import { PrismaClient } from '@prisma/client'
import { FeedSourceRepository } from '../FeedSourceRepository'
import { FeedSourceId } from '../../models/FeedSource'
import * as rx from 'rxjs'

export type Deps = {
  db: PrismaClient
}

export const findAll: Reader<Deps, FeedSourceRepository['findAll']> = (
  deps,
) => {
  return () =>
    pipe(
      TE.tryCatch(
        () => deps.db.feedSource.findMany(),
        flow<unknown[], Error>(unsafeCoerce),
      ),
      TE.map(
        A.map((feedSource) => ({
          ...feedSource,
          id: O.some(FeedSourceId(feedSource.id)) as O.Some<FeedSourceId>,
        })),
      ),
      ObE.fromTaskEither,
      ObE.chain((items) =>
        pipe(rx.from(items), (a) => ObE.observableEither.fromObservable(a)),
      ),
    )
}
