import { summonFor } from '@morphic-ts/batteries/lib/summoner-BASTJ'
import * as t from 'io-ts'

const { summon } = summonFor({})

export const RSSFeedItem = summon((F) =>
  F.interface(
    {
      title: F.nullable(F.string()),
      description: F.nullable(F.string()),
      link: F.nullable(F.string()),
      author: F.nullable(F.string()),
      guid: F.nullable(F.string()),
      pubDate: F.nullable(F.string()),
      isoDate: F.nullable(F.string()),
      categories: F.nullable(F.array(F.string())),
      image: F.nullable(F.string()),
    },
    'RSSFeedItem',
  ),
)

export type RSSFeedItem = t.TypeOf<typeof RSSFeedItem.type>

export const RSSFeed = summon((F) =>
  F.interface(
    {
      title: F.string(),
      description: F.string(),
      link: F.string(),
      items: F.nullable(F.array(RSSFeedItem(F))),
    },
    'RSSFeed',
  ),
)

export type RSSFeed = t.TypeOf<typeof RSSFeed.type>
