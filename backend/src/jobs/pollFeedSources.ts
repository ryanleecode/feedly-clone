import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject'
import * as rx from 'rxjs'
import * as rxo from 'rxjs/operators'
import { Cursor, Db } from 'mongodb'
import { FeedSource } from '../models/FeedSource'
import { flow, pipe } from 'fp-ts/lib/function'
import RSSParser from 'rss-parser'
import { Decoder, string } from 'io-ts'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import * as Ob from 'fp-ts-rxjs/lib/Observable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import { formatValidationErrors } from 'io-ts-reporters'
import { FeedItem } from '../models/FeedItem'
import { updateMany } from '@ryanleecode/mongad'
import parseISO from 'date-fns/fp/parseISO'

const rssParser = new RSSParser()

interface Order {
  id: number
  productName: string
  price: string
  purchaseDate: Date
}

/* export declare const db: Db

export declare function retrieveCompanies(
  limit: number,
  offset: number,
): Promise<Company[]> */

export type Dependencies = {
  db: Db
}

export function pollFeedSources({ db }: Dependencies) {
  const controller$ = new BehaviorSubject(0)

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
    controller$,
    rxo.mergeMap(
      (offset) =>
        cursorToStream(
          db.collection('FeedSource').find({}, { skip: offset, limit: 3 }),
        ),
      3,
    ),
    ObE.observableEither.fromObservable,
    ObE.chain(
      flow(
        FeedSource.decode,
        E.mapLeft(formatValidationErrors),
        E.mapLeft((e) => e.join(',')),
        TE.fromEither,
        ObE.fromTaskEither,
      ),
    ),
    ObE.chain((feedSource) =>
      pipe(
        TE.tryCatch(
          () => rssParser.parseURL(feedSource.url),
          (err) => `${err}`,
        ),
        ObE.fromTaskEither,
      ),
    ),
    ObE.map((output) => output.items || []),
    ObE.chain((items) =>
      pipe(rx.from(items), (a) => ObE.observableEither.fromObservable(a)),
    ),
    ObE.chain((rssItem) =>
      pipe(
        TE.tryCatch(
          () =>
            db.collection<FeedItem>('FeedItem').updateMany(
              { link: rssItem.link },
              {
                $set: {
                  title: rssItem.title,
                  link: rssItem.link,
                  date: rssItem.isoDate ? parseISO(rssItem.isoDate) : undefined,
                },
              },
              { upsert: true },
            ),
          (err) => `${err}`,
        ),
        ObE.fromTaskEither,
      ),
    ),
    ObE.map((a) => a.result),
  )
}
