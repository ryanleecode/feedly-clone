import { Brand } from 'ts-brand'

export type FeedSource = {
  readonly url: string
}

export type FeedSourceEntity = FeedSource & {
  readonly id: Brand<string, 'FeedSource'>
}
