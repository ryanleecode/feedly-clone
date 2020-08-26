import { Kind, URIS } from 'fp-ts/lib/HKT'
import { none, Option } from 'fp-ts/lib/Option'

interface Item {
  readonly name: string // or Opaque<string, 'ItemName'>
  readonly price: BigInt
}

interface ItemRepository<F extends URIS, G extends URIS> {
  /**
   * Here's the "gotcha": you'll have to add explicit parameter to all places,
   * whereas in Scala you have those convenient implicits:
   */
  readonly findAll: () => Kind<G, Item>
  readonly find: (name: string) => Kind<F, Option<Item>>
  readonly save: (item: Item) => Kind<F, void>
  readonly remove: (name: string) => Kind<F, void>
}
