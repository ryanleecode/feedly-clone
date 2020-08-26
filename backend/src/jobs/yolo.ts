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

export interface Database<F extends URIS, G extends URIS> {
  readonly getFeedSources: () => Kind<G, Kind<F, Either<Error, FeedSource>>>
  readonly getFeedItems: () => Kind<G, Kind<F, Either<Error, FeedSource>>>
}

export interface FeedCatalogue<F extends URIS, G extends URIS> {
  readonly getFeed: (
    feedURL: string,
  ) => Kind<G, Kind<F, Either<Error, FeedItem>>>
}

export type Program<F extends URIS, G extends URIS> = Database<F, G> &
  FeedCatalogue<F, G> &
  Monad1<F | G>

export function pollFeedSources<F extends URIS, G extends URIS>(
  P: Program<F, G>,
) {
  /*   return Do(P)
    .bind('feedSources', P.getFeedSources())
    .bindL('feedItem', ({ feedSources }) => {
      const derp = pipe(
        P.map(
          feedSources,
          flow(
            E.map((feedSource) => P.getFeed(feedSource.url)),
            E.fold(
              (e) => P.of<G>(P.of<F>(e)),
              (a) => a,
            ),
          ),
        ),
      )

      return pipe(
        P.map(
          feedSources,
          E.fold(
            (e) => P.of(E.left<Error, FeedItem>(e)),
            (feedSource) => P.getFeed(feedSource.url),
          ),
        ),
      )
    })
    .return(({ feedItem }) => feedItem) */
}
