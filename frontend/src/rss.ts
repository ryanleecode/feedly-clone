import Parser from 'rss-parser'
import { flow, pipe } from 'fp-ts/lib/function'
import { task, cmd } from 'elm-ts/lib'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import { formatValidationErrors } from 'io-ts-reporters'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-BASTJ'
import * as t from 'io-ts'

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

function wrap(s1: string) {
  return (s2: string) => {
    return `${s1}: ${s2}`
  }
}

const parser = new Parser()

export function parseURL<T>(
  handler: (output: E.Either<E.Either<unknown, string>, RSSFeed>) => T,
) {
  return (url: string): cmd.Cmd<T> => {
    return pipe(
      TE.tryCatch(
        () => parser.parseURL(url),
        (err): E.Either<unknown, string> => {
          const message = `failed to parse rss feed from ${url}`

          if (err instanceof Error) {
            return pipe(err.message, wrap(message), E.right)
          } else if (typeof err === 'string') {
            return pipe(err, wrap(message), E.right)
          }

          return E.left(err)
        },
      ),
      TE.chainW(
        flow(
          RSSFeed.type.decode,
          E.mapLeft(formatValidationErrors),
          E.mapLeft((e) => e.join(',')),
          E.mapLeft(E.right),
          TE.fromEither,
        ),
      ),
      task.attempt(handler),
    )
  }
}
