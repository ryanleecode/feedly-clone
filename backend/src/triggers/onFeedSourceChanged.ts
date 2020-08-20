import { flow, unsafeCoerce } from 'fp-ts/lib/function'
import { pipe } from 'fp-ts/lib/pipeable'
import { ChangeEvent, Cursor, Db } from 'mongodb'
import * as rx from 'rxjs'
import * as rxo from 'rxjs/operators'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import { gogo } from '../jobs/pollFeedSources'

export type Dependencies = {
  db: Db
}

export function onFeedSourceChanged({ db }: Dependencies) {
  const cursorToStream = (cursor: Cursor<unknown>) => {
    const next$ = () =>
      pipe(
        rx.from(cursor.hasNext()),
        rxo.concatMap((hasNext) =>
          hasNext ? rx.from(cursor.next()) : rx.EMPTY,
        ),
      )

    return next$().pipe(rxo.expand(() => next$()))
  }

  return pipe(
    cursorToStream(db.collection('FeedSource').watch().stream()),
    rxo.map(flow<unknown[], ChangeEvent>(unsafeCoerce)),
    ObE.observableEither.fromObservable,
    ObE.chain((changeEvent) => {
      switch (changeEvent.operationType) {
        case 'insert':
        case 'update':
          return pipe(changeEvent.fullDocument, gogo({ db }))
        default:
          return ObE.right(undefined as void)
      }
    }),
  )
}
