import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { FeedSource } from '../_models/FeedSource'
import { WebFeedItem } from '../_models/WebFeedItem'

export interface WebFeedItemRepository {
  readonly findAllFromSource: (
    source: FeedSource,
  ) => ObservableEither<Error, WebFeedItem>
}
