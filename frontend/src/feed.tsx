import * as React from 'react'
import { cmd, http } from 'elm-ts/lib'
import { Html } from 'elm-ts/lib/React'
import * as t from 'io-ts'
import * as A from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'
import * as I from 'fp-ts/lib/Identity'
import * as E from 'fp-ts/lib/Either'
import * as rss from './lib/rss'
import { flow, pipe } from 'fp-ts/lib/function'
import { classnames } from 'tailwindcss-classnames'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-BASTJ'
import { RSSFeed } from './lib/rss'
import { formatValidationErrors } from 'io-ts-reporters'
import * as Iso from 'monocle-ts/lib/Iso'
import * as L from 'monocle-ts/lib/Lens'
import * as Opt from 'monocle-ts/lib/Optional'
import parseISO from 'date-fns/fp/parseISO'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const { summon } = summonFor({})

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

export const RelativeTimeISO = Iso.asOptional<string, string>({
  get: flow(parseISO, (date) => formatDistanceToNow(date, { addSuffix: true })),
  reverseGet: (a) => a,
})

const NewsItemRelativeTime = pipe(
  NewsItem.optionalFromOptionProp('isoDate'),
  Opt.compose(RelativeTimeISO),
)

export type Model = {
  feedURL: string
  feed: Array<t.TypeOf<typeof NewsItem.type>>
}

export const init: [Model, cmd.Cmd<Msg>] = [{ feedURL: '', feed: [] }, cmd.none]

// --- Messages
export type GetRSSFeed = { type: 'GetRSSFeed' }
export type GetRSSFeedError = { type: 'RSSFeedError'; payload: http.HttpError }
export type GetRSSFeedParsed = {
  type: 'GetRSSFeedParsed'
  payload: rss.RSSFeed
}
export type UpdateFeedURL = { type: 'UpdateFeedURL'; payload: string }
export type Msg =
  | GetRSSFeed
  | GetRSSFeedError
  | GetRSSFeedParsed
  | UpdateFeedURL

// --- Update
export function update(msg: Msg, model: Model): [Model, cmd.Cmd<Msg>] {
  switch (msg.type) {
    case 'GetRSSFeed':
      return [model, getRSSFeed('/api/v1/rss')(model.feedURL)]
    case 'UpdateFeedURL':
      return [{ feed: model.feed, feedURL: msg.payload }, cmd.none]
    case 'RSSFeedError':
      return [model, cmd.none]
    case 'GetRSSFeedParsed': {
      const nextFeed = pipe(
        msg.payload.items,
        O.map(
          A.map((item) =>
            NewsItem.build({
              title: pipe(
                item.title,
                O.fold(() => 'No Title', I.identity.of),
              ),
              description: item.description,
              link: item.link,
              author: item.author,
              isoDate: item.isoDate,
              imageURL: item.image,
            }),
          ),
        ),
        O.fold(() => [], I.identity.of),
      )

      return [{ feedURL: model.feedURL, feed: nextFeed }, cmd.none]
    }
    default:
      return [model, cmd.none]
  }
}

// --- http
function getRSSFeed(endpoint: string) {
  return (rssFeedURL: string) => {
    return pipe(
      http.get(
        `${endpoint}?rssURL=${rssFeedURL}`,
        flow(
          RSSFeed.type.decode,
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
export function view({ feed }: Model): Html<Msg> {
  return (dispatch) => (
    <div>
      <header>
        <h1 className={classnames('text-xl', 'font-semibold')}>My Feed</h1>
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
          onChange={(e) =>
            dispatch({ type: 'UpdateFeedURL', payload: e.target.value })
          }
        />
        <input type="submit" value="Submit" />
      </form>
      <ul>
        {feed.map((newsItem) => {
          const image = pipe(
            O.option.map(newsItem.imageURL, (url) => (
              <img
                className={classnames(
                  ...(['inline', ...['w-40', 'h-24']] as const),
                )}
                src={url}
              />
            )),
            O.toNullable,
          )

          const relativeTime = NewsItemRelativeTime.getOption(newsItem)

          return (
            <li key={newsItem.title}>
              {image}
              <span>{newsItem.title}</span>
              {O.isSome(newsItem.description) ? (
                <span> | {newsItem.description.value}</span>
              ) : null}
              {O.isSome(relativeTime) ? (
                <span> | {relativeTime.value}</span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
