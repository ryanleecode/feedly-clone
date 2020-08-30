/* eslint-disable @typescript-eslint/no-unused-vars */
import { flow, pipe, unsafeCoerce } from 'fp-ts/lib/function'
import { Reader } from 'fp-ts/lib/Reader'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import * as O from 'fp-ts/lib/Option'
import * as TE from 'fp-ts/lib/TaskEither'
import * as A from 'fp-ts/lib/Array'
import * as E from 'fp-ts/lib/Either'
import { PrismaClient } from '@prisma/client'
import * as rx from 'rxjs'
import { WebFeedItemRepository } from '../WebFeedItemRepository'
import RSSParser from 'rss-parser'
import { getLinkPreview } from 'link-preview-js'
import { WebFeedItem } from '../../models/WebFeedItem'
import parseISO from 'date-fns/fp/parseISO'
import sanitizeHTML from 'sanitize-html'
import * as t from 'io-ts'

const WebFeedItem = t.intersection([
  t.type({
    title: t.string,
    link: t.string,
    isoDate: t.string,
  }),
  t.partial({ content: t.string, creator: t.string }),
])

export type Deps = {
  db: PrismaClient
  rssParser: RSSParser
}

export const findAllFromSource: Reader<
  Deps,
  WebFeedItemRepository['findAllFromSource']
> = (deps) => {
  return (feedSource) =>
    pipe(
      getRSSFeed(deps.rssParser)(feedSource.url),
      ObE.chain((rssItem) =>
        pipe(
          getLinkPreviewImage(rssItem.link),
          TE.map((image) => ({ ...rssItem, image })),
          ObE.fromTaskEither,
        ),
      ),
      ObE.map(
        (rssItem): WebFeedItem =>
          pipe({
            ...rssItem,
            id: O.none,
            feedSourceId: feedSource.id.value,
          }),
      ),
    )
}

// -----------------------------------------------------------------------------
// Util
// -----------------------------------------------------------------------------

function getLinkPreviewImage(
  link: string,
): TE.TaskEither<Error, O.Option<string>> {
  return pipe(
    TE.tryCatch(
      () => getLinkPreview(link),
      flow<unknown[], Error>(unsafeCoerce),
    ),
    TE.map((preview) =>
      'images' in preview ? A.head(preview.images) : O.none,
    ),
  )
}

const getRSSFeed = (rssParser: RSSParser) => {
  return (url: string) =>
    pipe(
      TE.tryCatch(
        () => rssParser.parseURL(url),
        flow<unknown[], Error>(unsafeCoerce),
      ),
      TE.map((output) => output.items ?? []),
      TE.map(
        flow(
          A.map(
            flow(
              WebFeedItem.decode,
              E.map((rssItem) => ({
                title: rssItem.title,
                link: rssItem.link,
                date: pipe(rssItem.isoDate, parseISO),
                content: pipe(
                  O.fromNullable(rssItem.content),
                  O.map(sanitizeHTML),
                ),
                author: pipe(O.fromNullable(rssItem.creator)),
                image: O.none as O.Option<string>,
              })),
            ),
          ),
          A.filter(E.isRight),
          A.map(({ right }) => right),
        ),
      ),
      ObE.fromTaskEither,
      ObE.chain((items) =>
        pipe(rx.from(items), (a) => ObE.observableEither.fromObservable(a)),
      ),
    )
}
