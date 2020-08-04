import * as React from 'react'
import { cmd } from 'elm-ts/lib'
import { Html } from 'elm-ts/lib/React'
import * as t from 'io-ts'
import { summonFor } from '@morphic-ts/batteries/lib/summoner-BASTJ'
import * as A from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'
import * as I from 'fp-ts/lib/Identity'
import * as E from 'fp-ts/lib/Either'
import { flow, pipe } from 'fp-ts/lib/function'
import * as rss from './rss'

const { summon } = summonFor({})

// --- Model
export const NewsItem = summon((F) =>
  F.interface({ title: F.string() }, 'NewsItem'),
)

export type Model = {
  feedURL: string
  feed: Array<t.TypeOf<typeof NewsItem.type>>
}

export const init: [Model, cmd.Cmd<Msg>] = [{ feedURL: '', feed: [] }, cmd.none]

// --- Messages
export type Msg =
  | { type: 'GetRSSFeed' }
  | { type: 'RSSFeedError' }
  | { type: 'RSSFeedParsed'; payload: rss.ParserOutput }
  | { type: 'UpdateFeedURL'; payload: string }

// --- Update
export function update(msg: Msg, model: Model): [Model, cmd.Cmd<Msg>] {
  switch (msg.type) {
    case 'GetRSSFeed':
      return [
        model,
        rss.parseURL<Msg>(
          flow(
            E.fold(
              (): Msg => ({ type: 'RSSFeedError' }),
              (a): Msg => ({ type: 'RSSFeedParsed', payload: a }),
            ),
          ),
        )(model.feedURL),
      ]
    case 'UpdateFeedURL':
      return [{ feed: model.feed, feedURL: msg.payload }, cmd.none]
    case 'RSSFeedError':
      return [model, cmd.none]
    case 'RSSFeedParsed': {
      const nextFeed = pipe(
        msg.payload.items,
        O.fromNullable,
        O.map(
          flow(
            A.map(({ title }) =>
              pipe(
                O.fromNullable(title),
                O.map((title) => NewsItem.build({ title })),
              ),
            ),
            A.filter(O.isSome),
            A.map(({ value }) => value),
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

// --- View
export function view({ feed }: Model): Html<Msg> {
  return (dispatch) => (
    <div>
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
        {feed.map((newsItem) => (
          <li key={newsItem.title}>{newsItem.title}</li>
        ))}
      </ul>
    </div>
  )
}
