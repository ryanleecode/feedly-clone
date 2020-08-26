import { Kind, URIS } from 'fp-ts/lib/HKT'
import { Do } from 'fp-ts-contrib/lib/Do'
import { Monad1 } from 'fp-ts/lib/Monad'
import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { flow, pipe } from 'fp-ts/lib/function'
import { Brand } from 'ts-brand'
import { Either } from 'fp-ts/lib/Either'
import * as E from 'fp-ts/lib/Either'
import { Option } from 'fp-ts/lib/Option'

export type FeedSource = {
  id: Brand<string, 'FeedSource'>
  url: string
}

export type FeedItem = {
  feedSourceId: string
  title: string
  link: string
  date: Date
  content?: string
  author?: string
  image?: string
}

export type DBFeedItem = FeedItem & {
  id: Brand<string, 'FeedItem'>
}

export interface FeedRepository {
  readonly getFeedSources: () => ObservableEither<Error, FeedSource>
  readonly getFeedItems: () => ObservableEither<Error, FeedItem>
}

export interface LiveFeedRepository {
  readonly getLiveFeedItems: (
    feedURL: string,
  ) => ObservableEither<Error, FeedItem>
}

export function pollFeedSources(deps: FeedRepository & LiveFeedRepository) {
  return Do(ObE.observableEither)
    .bind('feedSource', deps.getFeedSources())
    .bindL('feedItem', ({ feedSource }) =>
      deps.getLiveFeedItems(feedSource.url),
    )
    .return(({ feedItem }) => feedItem)
}
