import { ObservableEither } from 'fp-ts-rxjs/lib/ObservableEither'
import { FeedSource } from '../_models/FeedSource'

export interface FeedSourceRepository {
  readonly findAll: () => ObservableEither<Error, FeedSource>
}
