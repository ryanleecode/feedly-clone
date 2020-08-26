import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject'
import * as rx from 'rxjs'
import * as rxo from 'rxjs/operators'
import { Cursor, Db } from 'mongodb'
import { FeedSource } from '../models/FeedSource'
import { constVoid, flow, identity, pipe } from 'fp-ts/lib/function'
import RSSParser from 'rss-parser'
import { Decoder, string } from 'io-ts'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import * as Ob from 'fp-ts-rxjs/lib/Observable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { formatValidationErrors } from 'io-ts-reporters'
import { FeedItem } from '../models/FeedItem'
import { updateMany } from '@ryanleecode/mongad'
import parseISO from 'date-fns/fp/parseISO'
import { getLinkPreview } from 'link-preview-js'
import sanitizeHTML from 'sanitize-html'
import * as A from 'fp-ts/lib/Array'
import { withTimeout } from 'fp-ts-contrib/lib/Task/withTimeout'
import { Kind, URIS } from 'fp-ts/lib/HKT'

const rssParser = new RSSParser()

/* export declare const db: Db

export declare function retrieveCompanies(
  limit: number,
  offset: number,
): Promise<Company[]> */

export type Dependencies = {
  db: Db
}

export function gogo({ db }: Dependencies) {
  return flow(
    FeedSource.decode,
    E.mapLeft(formatValidationErrors),
    E.mapLeft((e) => e.join(',')),
    TE.fromEither,
    ObE.fromTaskEither,
    ObE.chain((feedSource) =>
      pipe(
        TE.tryCatch(
          () => rssParser.parseURL(feedSource.url),
          (err) => `Parse URL Error: ${JSON.stringify(feedSource)} ${err}`,
        ),
        ObE.fromTaskEither,
        ObE.map((output) => output.items || []),
        ObE.chain((items) =>
          pipe(rx.from(items), (a) => ObE.observableEither.fromObservable(a)),
        ),
        ObE.chain((rssItem) =>
          pipe(
            O.fromNullable(rssItem.link),
            O.map((link) =>
              pipe(
                TE.tryCatch(
                  () => getLinkPreview(link),
                  (err) => `${err}`,
                ),
                TE.map((preview) =>
                  'images' in preview ? A.head(preview.images) : O.none,
                ),
                TE.map(O.toUndefined),
                TE.map((image) => ({ ...rssItem, image })),
              ),
            ),
            O.fold(
              () =>
                TE.right<string, RSSParser.Item & { image?: string }>(rssItem),
              identity,
            ),
            ObE.fromTaskEither,
          ),
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
                      feed_source_id: feedSource._id,
                      link: rssItem.link,
                      date: rssItem.isoDate
                        ? parseISO(rssItem.isoDate)
                        : undefined,
                      content: rssItem.content
                        ? sanitizeHTML(rssItem.content)
                        : undefined,
                      image: rssItem.image,
                    },
                  },
                  { upsert: true },
                ),
              (err) => `${err}: ${JSON.stringify(rssItem)}`,
            ),
            ObE.fromTaskEither,
          ),
        ),
      ),
    ),
    ObE.map(constVoid),
  )
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
    ObE.chain(gogo({ db })),
  )
}
