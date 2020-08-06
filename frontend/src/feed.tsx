import * as React from 'react'
import { cmd, http } from 'elm-ts/lib'
import { Html } from 'elm-ts/lib/React'
import * as t from 'io-ts'
import * as A from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'
import * as I from 'fp-ts/lib/Identity'
import * as E from 'fp-ts/lib/Either'
import { flow, pipe } from 'fp-ts/lib/function'
import { classnames } from 'tailwindcss-classnames'
import * as rss from './rss'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-BASTJ'
import { RSSFeed } from './rss'
import { formatValidationErrors } from 'io-ts-reporters'

const { summon } = summonFor({})

// --- Model
export const NewsItem = summon((F) =>
  F.interface(
    { title: F.string(), description: F.nullable(F.string()) },
    'NewsItem',
  ),
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
          flow(
            A.map((item) =>
              NewsItem.build({
                title: pipe(
                  item.title,
                  O.fold(() => 'No Title', I.identity.of),
                ),
                description: item.description,
              }),
            ),
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
        flow(
          E.fold<
            http.HttpError,
            rss.RSSFeed,
            GetRSSFeedError | GetRSSFeedParsed
          >(
            (err) => ({ type: 'RSSFeedError', payload: err }),
            (rssFeed) => ({
              type: 'GetRSSFeedParsed',
              payload: rssFeed,
            }),
          ),
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
        {feed.map(({ title, description }) => (
          <li key={title}>
            <span>{title}</span>
            {O.isSome(description) ? (
              <>
                <span> | {description.value}</span>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
