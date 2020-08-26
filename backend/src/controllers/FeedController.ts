import { Router } from 'express'
import { flow, pipe } from 'fp-ts/lib/function'
import { toRequestHandler } from 'hyper-ts/lib/express'
import * as H from 'hyper-ts'
import * as t from 'io-ts'
import { formatValidationErrors } from 'io-ts-reporters'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import isURL from 'validator/lib/isURL'
import url from 'url'
import * as L from 'monocle-ts/lib/Lens'
import * as Iso from 'monocle-ts/lib/Iso'
import * as R from 'fp-ts/lib/Reader'
import { Cursor, Db } from 'mongodb'
import { FeedSource } from '../models/FeedSource'
import RSSParser from 'rss-parser'
import * as rx from 'rxjs'
import * as rxo from 'rxjs/operators'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import * as Ob from 'fp-ts-rxjs/lib/Observable'
import { FeedItem } from '../models/FeedItem'

const cursorToStream = (cursor: Cursor<unknown>) => {
  const next$ = () =>
    pipe(
      rx.from(cursor.hasNext()),
      rxo.concatMap((hasNext) => (hasNext ? rx.from(cursor.next()) : rx.EMPTY)),
    )

  return next$().pipe(rxo.expand(() => next$()))
}

const rssParser = new RSSParser()

export type Dependencies = {
  db: Db
}

export function router({ db }: Dependencies): Router {
  const router = Router()

  router.get(
    '/',
    toRequestHandler(
      pipe(
        H.iof(undefined),
        H.ichain(() =>
          pipe(
            cursorToStream(db.collection('FeedItem').find()),
            ObE.observableEither.fromObservable,
            ObE.chain(flow(FeedItem.decode, TE.fromEither, ObE.fromTaskEither)),
            rxo.filter(E.isRight),
            rxo.map(({ right }) => right),
            rxo.toArray(),
            Ob.toTask,
            TE.fromTask,
            H.fromTaskEither,
          ),
        ),
        H.ichain((feedItems) =>
          pipe(
            H.status<unknown>(H.Status.OK),
            H.ichain(() => H.json<unknown>(feedItems, () => 'error')),
          ),
        ),
      ),
    ),
  )

  router.post(
    '/',
    toRequestHandler(
      pipe(
        H.decodeBody(requestDTO.decode),
        H.mapLeft(formatValidationErrors),
        H.mapLeft((a) => a.join(',')),
        H.ichain((body) =>
          isURL(body.feedUrl) ? H.right(body) : H.left('feed url is invalid'),
        ),
        H.map((body) => ({ ...body, feedUrl: url.parse(body.feedUrl) })),
        H.chainFirst(({ feedUrl }) =>
          H.tryCatch(
            () => rssParser.parseURL(feedUrl.href),
            (err): string => `${err}`,
          ),
        ),
        H.chain(({ feedUrl }) =>
          H.tryCatch(
            async () => {
              const collection = db.collection<FeedSource>('FeedSource')

              await collection.findOneAndUpdate(
                { url: feedUrl.href },
                { $set: { url: feedUrl.href } },
                { upsert: true },
              )
            },
            (err) => `${err}`,
          ),
        ),
        H.ichain((a) =>
          pipe(
            H.status(H.Status.OK),
            H.ichain(() => H.json({ a: 'asdf' }, () => 'encode json failed')),
          ),
        ),
      ),
    ),
  )

  return router
}

type RequestDTO = t.TypeOf<typeof requestDTO>

const requestDTO = t.type({
  feedUrl: t.string,
})

export const FeedSourceController = router
