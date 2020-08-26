import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { FeedItem } from '../_models/FeedItem'

export interface FeedItemRepository {
  readonly save: (item: FeedItem) => ObservableEither<Error, FeedItem>
}
