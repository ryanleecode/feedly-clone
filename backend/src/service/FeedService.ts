import { chain, map } from 'fp-ts-rxjs/lib/ObservableEither'
import { constVoid, pipe } from 'fp-ts/lib/function'
import { Either } from 'fp-ts/lib/Either'
import { ReaderObservable } from 'fp-ts-rxjs/lib/ReaderObservable'
import { FeedSourceRepository } from '../repository/FeedSourceRepository'
import { FeedItemRepository } from '../repository/FeedItemRepository'
import { WebFeedItemRepository } from '../repository/WebFeedItemRepository'

export type Deps = {
  feedRepository: FeedSourceRepository
  feedItemRepository: FeedItemRepository
  webFeedRepository: WebFeedItemRepository
}

export const refresh: ReaderObservable<Deps, Either<Error, void>> = ({
  feedRepository,
  feedItemRepository,
  webFeedRepository,
}) => {
  return pipe(
    feedRepository.findAll(),
    chain(webFeedRepository.findAllFromSource),
    chain(feedItemRepository.save),
    map(constVoid),
  )
}
