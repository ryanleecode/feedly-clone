import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { FeedSourceEntity } from '../models/FeedSource'
import { WebFeedItem } from '../models/WebFeedItem'

export interface WebFeedItemRepository {
  readonly findAllFromSource: (
    source: FeedSourceEntity,
  ) => ObservableEither<Error, WebFeedItem>
}
