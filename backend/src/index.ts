import express from 'express'
import { flow, pipe } from 'fp-ts/lib/function'
import * as H from 'hyper-ts'
import { toRequestHandler } from 'hyper-ts/lib/express'
import * as t from 'io-ts'
import { formatValidationErrors } from 'io-ts-reporters'
import RSSParser from 'rss-parser'
import * as E from 'fp-ts/lib/Either'
import * as I from 'fp-ts/lib/Identity'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-BASTJ'

const { summon } = summonFor({})

export const RSSFeedItem = summon((F) =>
  F.interface(
    {
      title: F.nullable(F.string()),
      description: F.nullable(F.string()),
      link: F.nullable(F.string()),
      author: F.nullable(F.string()),
      guid: F.nullable(F.string()),
      pubDate: F.nullable(F.string()),
      isoDate: F.nullable(F.string()),
      categories: F.nullable(F.array(F.string())),
    },
    'RSSFeedItem',
  ),
)

export type RSSFeedItem = t.TypeOf<typeof RSSFeedItem.type>

export const RSSFeed = summon((F) =>
  F.interface(
    {
      title: F.string(),
      description: F.string(),
      link: F.string(),
      items: F.nullable(F.array(RSSFeedItem(F))),
    },
    'RSSFeed',
  ),
)

export type RSSFeed = t.TypeOf<typeof RSSFeed.type>

function serverError<E = never>(
  message: string,
): H.Middleware<H.StatusOpen, H.ResponseEnded, E, void> {
  return pipe(
    H.status(H.Status.InternalServerError),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(message)),
  )
}

function wrap(s1: string) {
  return (s2: string) => {
    return `${s1}: ${s2}`
  }
}

const rssParser = new RSSParser()

const rssFeed = pipe(
  H.decodeQuery(
    t.strict({
      rssURL: t.string,
    }).decode,
  ),
  H.mapLeft(formatValidationErrors),
  H.mapLeft((a) => a.join(',')),
  H.mapLeft(E.right),
  H.ichain(({ rssURL }) =>
    H.tryCatch(
      () => rssParser.parseURL(rssURL),
      (err): E.Either<[unknown, string], string> => {
        const message = `failed to parse rss feed from ${rssURL}`

        if (err instanceof Error) {
          return pipe(err.message, wrap(message), E.right)
        } else if (typeof err === 'string') {
          return pipe(err, wrap(message), E.right)
        }

        return E.left([err, message])
      },
    ),
  ),
  H.ichain(
    flow(
      RSSFeed.type.decode,
      E.mapLeft(formatValidationErrors),
      E.mapLeft((a) => a.join(',')),
      E.mapLeft<string, E.Either<[unknown, string], string>>(E.right),
      (either) => H.fromEither(either),
    ),
  ),
  H.map(RSSFeed.type.encode),
  H.ichain((rssFeed) =>
    pipe(
      H.status<E.Either<[unknown, string], string>>(H.Status.OK),
      H.ichain(() => H.json(rssFeed, () => E.right('encode json failed'))),
    ),
  ),
  H.orElse((e) =>
    serverError<E.Either<[unknown, string], string>>(
      pipe(
        e,
        E.fold(() => 'internal server error', I.identity.of),
      ),
    ),
  ),
)
express()
  .get('/', toRequestHandler(rssFeed))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
