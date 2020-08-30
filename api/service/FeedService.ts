import { chain, map } from 'fp-ts-rxjs/lib/ObservableEither'
import { constVoid, pipe } from 'fp-ts/lib/function'
import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { Reader } from 'fp-ts/lib/Reader'
import { FeedSourceRepository } from '../repository/FeedSourceRepository'
import { FeedItemRepository } from '../repository/FeedItemRepository'
import { WebFeedItemRepository } from '../repository/WebFeedItemRepository'

export type Deps = {
  feedSourceRepository: FeedSourceRepository
  feedItemRepository: FeedItemRepository
  webFeedItemRepository: WebFeedItemRepository
}

export type RefreshOperation = () => ObservableEither<Error, void>

export const refresh: Reader<Deps, RefreshOperation> = ({
  feedSourceRepository,
  feedItemRepository,
  webFeedItemRepository,
}) => {
  return () =>
    pipe(
      feedSourceRepository.findAll(),
      chain(webFeedItemRepository.findAllFromSource),
      chain(feedItemRepository.save),
      map(constVoid),
    )
}
