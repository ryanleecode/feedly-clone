import { Option } from 'fp-ts/lib/Option'
import { Brand } from 'ts-brand'

export type FeedItem = {
  readonly feedSourceId: Brand<string, 'FeedSource'>
  readonly title: string
  readonly link: Option<string>
  readonly date: Date
  readonly content: Option<string>
  readonly author: Option<string>
  readonly image: Option<string>
}

export type FeedItemEntity = FeedItem & {
  readonly id: Brand<string, 'FeedItem'>
}
