import { Option, Some } from 'fp-ts/lib/Option'
import { Brand, make } from 'ts-brand'
import { Except } from 'type-fest'

export type FeedItemId = Brand<string, 'FeedItem'>

export const FeedItemId = make<FeedItemId>()

export type FeedItem = {
  readonly id: Option<FeedItemId>
  readonly feedSourceId: Brand<string, 'FeedSource'>
  readonly title: string
  readonly link: string
  readonly date: Date
  readonly content: Option<string>
  readonly author: Option<string>
  readonly image: Option<string>
}

export type FeedItemEntity = Except<FeedItem, 'id'> & {
  readonly id: Some<FeedItemId>
}
