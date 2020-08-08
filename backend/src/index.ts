import express from 'express'
import { flow, pipe } from 'fp-ts/lib/function'
import * as H from 'hyper-ts'
import { toRequestHandler } from 'hyper-ts/lib/express'
import * as t from 'io-ts'
import { formatValidationErrors } from 'io-ts-reporters'
import RSSParser from 'rss-parser'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import * as I from 'fp-ts/lib/Identity'
import * as A from 'fp-ts/lib/Array'
import { withValidate, fromRefinement } from 'io-ts-types'
import { summonFor as summonForESBASTJ } from '@morphic-ts/batteries/lib/summoner-ESBASTJ'
import { summonFor as summonForBASTJ } from '@morphic-ts/batteries/lib/summoner-BASTJ'
import { fromTraversable, Iso } from 'monocle-ts'
import * as T from 'fp-ts/lib/Task'
import { getLinkPreview } from 'link-preview-js'
import moment from 'moment'
import { sequenceT } from 'fp-ts/lib/Apply'
import pmap from 'p-map'
import { withTimeout } from 'fp-ts-contrib/lib/Task/withTimeout'

interface IoTsTypes {
  withValidate: typeof withValidate
}

type SummonConfig = {
  IoTsURI: IoTsTypes
}

const { summon: summonESBASTJ } = summonForESBASTJ<SummonConfig>({
  IoTsURI: { withValidate },
})

const RSSFeedItemTitleAndDescriptionUnion = summonForBASTJ({}).summon((F) =>
  F.union(
    [
      F.interface(
        {
          title: F.string(),
        },
        'RSSFeedItemTitle',
      ),
      F.interface(
        {
          description: F.string(),
        },
        'RSSFeedItemDescription',
      ),
      F.interface(
        {
          title: F.string(),
          description: F.string(),
        },
        'RSSFeedItemTitleAndDescription',
      ),
    ],
    'RSSFeedItemTitleAndDescriptionUnion',
  ),
)

export const RSSFeedItem = summonESBASTJ((F) =>
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
    {
      IoTsURI: (codec, env) =>
        env.withValidate(codec, (u, c) =>
          E.either.chain(
            RSSFeedItemTitleAndDescriptionUnion.type.validate(u, c),
            () => codec.validate(u, c),
          ),
        ),
    },
  ),
)

export type RSSFeedItem = t.TypeOf<typeof RSSFeedItem.type>

export const RSSFeed = summonESBASTJ((F) =>
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

const GetRSSFeedDTO = summonESBASTJ((F) =>
  F.intersection(
    [
      RSSFeed(F),
      F.interface(
        {
          items: F.nullable(
            F.array(
              F.intersection(
                [
                  RSSFeedItem(F),
                  F.interface(
                    {
                      image: F.nullable(F.string()),
                    },
                    'RSSFeedImage',
                  ),
                ],
                'RSSFeedItem',
              ),
            ),
          ),
        },
        'RSSFeed',
      ),
    ],
    'GetRSSFeedDTO',
  ),
)

export type GetRSSFeedDTO = t.TypeOf<typeof GetRSSFeedDTO.type>

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
  H.ichain((parserOutput) =>
    pipe(
      RSSFeed.type.decode(parserOutput),
      E.mapLeft(formatValidationErrors),
      E.mapLeft((a) => a.join(',')),
      E.mapLeft<string, E.Either<[unknown, string], string>>(E.right),
      (either) => H.fromEither(either),
    ),
  ),
  H.chain((rssFeed) =>
    pipe(
      rssFeed.items,
      O.fold(() => [], I.identity.of),
      (items) =>
        pipe(
          items,
          A.map(({ link }) => link),
          A.map(
            O.fold(
              () => T.of(O.none),
              (link) =>
                pipe(
                  TE.tryCatch(
                    () => getLinkPreview(link),
                    () => O.none,
                  ),
                  TE.map((preview) =>
                    'images' in preview ? A.head(preview.images) : O.none,
                  ),
                  TE.fold(() => T.of(O.none), T.of),
                  withTimeout<O.Option<string>>(O.none, 5000),
                ),
            ),
          ),
          (tasks) => () => pmap(tasks, (t) => t()),
          T.map((images) =>
            A.zipWith(items, images, (item, image) => ({
              ...item,
              image,
            })),
          ),
        ),
      T.map((items) => ({
        ...rssFeed,
        items: O.option.map(rssFeed.items, () => items),
      })),
      (t) => TE.fromTask<E.Either<[unknown, string], string>, GetRSSFeedDTO>(t),
      H.fromTaskEither,
    ),
  ),
  H.map(GetRSSFeedDTO.type.encode),
  H.ichain((rssFeed) =>
    pipe(
      H.status<E.Either<[unknown, string], string>>(H.Status.OK),
      H.ichain(() => H.json(rssFeed, () => E.right('encode json failed'))),
    ),
  ),
  H.orElse(
    flow(
      E.fold(() => 'internal server error', I.identity.of),
      serverError,
    ),
  ),
)
express()
  .get('/api/v1/rss', toRequestHandler(rssFeed))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
