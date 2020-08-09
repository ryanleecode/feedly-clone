import * as React from 'react'
import { cmd, http } from 'elm-ts/lib'
import { Html } from 'elm-ts/lib/React'
import { Sub } from 'elm-ts/lib/Sub'
import * as Time from 'elm-ts/lib/Time'
import * as t from 'io-ts'
import * as A from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'
import * as I from 'fp-ts/lib/Identity'
import * as E from 'fp-ts/lib/Either'
import { sequenceT } from 'fp-ts/lib/Apply'
import { flow, pipe, tupled } from 'fp-ts/lib/function'
import parseISO from 'date-fns/fp/parseISO'
import formatDistanceStrictWithOptions from 'date-fns/fp/formatDistanceStrictWithOptions'
import fromUnixTime from 'date-fns/fp/fromUnixTime'
import * as L from 'monocle-ts/lib/Lens'
import * as Optional from 'monocle-ts/lib/Optional'
import * as Traversal from 'monocle-ts/lib/Traversal'
import { Img } from 'react-image'
import { formatValidationErrors } from 'io-ts-reporters'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-BASTJ'
import * as rss from './lib/rss'

const { summon } = summonFor({})

// --- Flags
export type Flags = Date

// --- Model
export const NewsItem = summon((F) =>
  F.interface(
    {
      title: F.string(),
      description: F.nullable(F.string()),
      link: F.nullable(F.string()),
      author: F.nullable(F.string()),
      isoDate: F.nullable(F.string()),
      imageURL: F.nullable(F.string()),
    },
    'NewsItem',
  ),
)

export type NewsItem = t.TypeOf<typeof NewsItem.type>

export type Model = {
  feedURL: string
  date: Date
  feed: NewsItem[]
}

export const init = (flags: Flags): [Model, cmd.Cmd<Msg>] => [
  { feedURL: '', date: flags, feed: [] },
  cmd.none,
]

// --- Messages
export type GetRSSFeed = { type: 'GetRSSFeed' }
export type GetRSSFeedError = { type: 'RSSFeedError'; payload: http.HttpError }
export type GetRSSFeedParsed = {
  type: 'GetRSSFeedParsed'
  payload: rss.RSSFeed
}
export type UpdateFeedURL = { type: 'UpdateFeedURL'; payload: string }
export type GetCurrentDate = { type: 'GetCurrentDate' }
export type SetCurrentDate = { type: 'SetCurrentDate'; payload: Date }
export type Msg =
  | GetRSSFeed
  | GetRSSFeedError
  | GetRSSFeedParsed
  | UpdateFeedURL
  | SetCurrentDate

// --- Update
export function update(msg: Msg, model: Model): [Model, cmd.Cmd<Msg>] {
  switch (msg.type) {
    case 'SetCurrentDate':
      return [
        pipe(
          pipe(L.id<Model>(), L.prop('date')).set,
          I.ap(msg.payload),
          I.ap(model),
        ),
        cmd.none,
      ]
    case 'GetRSSFeed':
      return [model, getRSSFeed('/api/v1/rss')(model.feedURL)]
    case 'UpdateFeedURL':
      return [
        pipe(
          pipe(L.id<Model>(), L.prop('feedURL')).set,
          I.ap(msg.payload),
          I.ap(model),
        ),
        cmd.none,
      ]
    case 'RSSFeedError':
      return [model, cmd.none]
    case 'GetRSSFeedParsed': {
      const nextFeed = pipe(
        L.id<rss.RSSFeed>(),
        L.prop('items'),
        L.composePrism<O.Option<rss.RSSFeedItem[]>, rss.RSSFeedItem[]>({
          getOption: I.identity.of,
          reverseGet: O.fromNullable,
        }),
        Optional.asTraversal,
        Traversal.foldMap(A.getMonoid<NewsItem>())(
          A.map((item) =>
            NewsItem.build({
              title: O.toNullable(item.title) ?? 'No Title',
              description: item.description,
              link: item.link,
              author: item.author,
              isoDate: item.isoDate,
              imageURL: item.image,
            }),
          ),
        ),
        I.ap(msg.payload),
      )

      return [
        pipe(
          pipe(L.id<Model>(), L.prop('feed')).set,
          I.ap(nextFeed),
          I.ap(model),
        ),
        cmd.none,
      ]
    }
    default:
      return [model, cmd.none]
  }
}

// --- Subscriptions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function subscriptions(_: Model): Sub<Msg> {
  return Time.every(
    60,
    flow(
      (ms) => ms / 1000,
      fromUnixTime,
      (date) => ({
        type: 'SetCurrentDate',
        payload: date,
      }),
    ),
  )
}

// --- Http
function getRSSFeed(endpoint: string) {
  return (rssFeedURL: string): cmd.Cmd<GetRSSFeedError | GetRSSFeedParsed> => {
    return pipe(
      http.get(
        `${endpoint}?rssURL=${rssFeedURL}`,
        flow(
          rss.RSSFeed.type.decode,
          E.mapLeft(formatValidationErrors),
          E.mapLeft((a) => a.join(',')),
        ),
      ),
      http.send(
        E.fold<http.HttpError, rss.RSSFeed, GetRSSFeedError | GetRSSFeedParsed>(
          (err) => ({ type: 'RSSFeedError', payload: err }),
          (rssFeed) => ({
            type: 'GetRSSFeedParsed',
            payload: rssFeed,
          }),
        ),
      ),
    )
  }
}

// --- View
export function view({ feed, date, feedURL }: Model): Html<Msg> {
  return (dispatch) => (
    <div>
      <header>
        <h1 className="text-xl font-semibold">My Feed</h1>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          dispatch({ type: 'GetRSSFeed' })
        }}
      >
        <input
          type="text"
          id="rssURL"
          value={feedURL}
          onChange={(e) =>
            dispatch({ type: 'UpdateFeedURL', payload: e.target.value })
          }
        />
        <input type="submit" value="Submit" />
      </form>
      <ul>
        {feed.map((newsItem) => {
          const { title, description, imageURL, link } = newsItem

          const relativeTime = pipe(
            sequenceT(O.option)(
              O.some({
                addSuffix: true,
              }),
              O.some(date),
              O.option.map(newsItem.isoDate, parseISO),
            ),
            O.map(tupled(formatDistanceStrictWithOptions)),
          )

          const Title = <span className="font-bold">{title}</span>

          return (
            <li key={title} className="flex / p-2">
              <Img
                className="object-scale-down rounded"
                src={O.toUndefined(imageURL) || ''}
                container={(children) => (
                  <div className="justify-center / flex flex-shrink-0 / mr-4 / w-32 h-20 ">
                    {children}
                  </div>
                )}
                loader={
                  <div className="block / animate-pulse">
                    <div className="w-32 h-20 / bg-gray-400" />
                  </div>
                }
                unloader={
                  <div className="flex / w-32 h-20 / object-scale-down rounded" />
                }
              />
              <div className="block">
                {O.isSome(link) ? <a href={link.value}>{Title}</a> : { Title }}
                {O.isSome(relativeTime) && <div>{relativeTime.value}</div>}
                {O.isSome(description) && <div>{description.value}</div>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
