import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { FeedItem, FeedItemEntity } from '../models/FeedItem'

export interface FeedItemRepository {
  readonly save: (item: FeedItem) => ObservableEither<Error, FeedItemEntity>
}
