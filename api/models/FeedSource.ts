import { Brand, make } from 'ts-brand'
import { Option, Some } from 'fp-ts/lib/Option'
import { Except } from 'type-fest'

export type FeedSourceId = Brand<string, 'FeedSource'>

export const FeedSourceId = make<FeedSourceId>()

export type FeedSource = {
  readonly id: Option<FeedSourceId>
  readonly url: string
}

export type FeedSourceEntity = Except<FeedSource, 'id'> & {
  readonly id: Some<FeedSourceId>
}
