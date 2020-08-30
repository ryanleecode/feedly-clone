import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { FeedSourceEntity } from '../models/FeedSource'

export interface FeedSourceRepository {
  readonly findAll: () => ObservableEither<Error, FeedSourceEntity>
}
