import { Do } from 'fp-ts-contrib/lib/Do'
import { array } from 'fp-ts/lib/Array'
import { constUndefined, identity, Lazy } from 'fp-ts/lib/function'
import { Kind, URIS } from 'fp-ts/lib/HKT'
import * as Id from 'fp-ts/lib/Identity'
import { Monad1 } from 'fp-ts/lib/Monad'
import { none, Option } from 'fp-ts/lib/Option'
import { Traversable1 } from 'fp-ts/lib/Traversable'

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly Promise: Promise<A>
    readonly Stream: Stream<URIS, A>
  }
}

// ***** Streams *****
// Functional stream is basically an eager "head" with a lazy "tail".
// In fs2 they are implemented a bit differently, in a more comples way, but for this demonstration this is irrelevant.

/**
 * Pure stream — an eager head and a lazy tail, consisting of another stream
 */
interface Pure<F extends URIS, O> {
  readonly tag: 'Pure'
  readonly head: O
  readonly tail: Lazy<Stream<F, O>>
}

/**
 * Empty stream — you can think of it as a terminal condition for the recursive data type
 */
interface Empty<F extends URIS, O> {
  readonly tag: 'Empty'
}

/**
 * Functional stream — either an empty stream or a pure stream.
 */
type Stream<F extends URIS, O> = Pure<F, O> | Empty<F, O>

// Constructors:

const cons = <F extends URIS, A>(
  head: A,
  tail: Lazy<Stream<F, A>>,
): Stream<F, A> => ({ tag: 'Pure', head, tail })

const empty = <F extends URIS, A>(): Stream<F, A> => ({ tag: 'Empty' })

// Due to `Stream` being a Tagless Final interface, you can specialize it to either sync or async computations:
type SyncStream<O> = Stream<Id.URI, O>
type AsyncStream<O> = Stream<'Promise', O> // for this to work, you'll need to define Promise as a HKT (see above).

// cats's Sync mock:
interface Sync<F extends URIS> {
  readonly pure: <A>(a: A) => Kind<F, A>
  readonly unit: () => Kind<F, void>
}

// ***** Algebras in TF style: *****

interface Item {
  readonly name: string // or Opaque<string, 'ItemName'>
  readonly price: BigInt
}

interface ItemRepository<F extends URIS, G extends URIS> {
  /**
   * Here's the "gotcha": you'll have to add explicit parameter to all places,
   * whereas in Scala you have those convenient implicits:
   */
  readonly findAll: (F: Sync<F>) => () => Kind<G, Item>
  readonly find: (F: Sync<F>) => (name: string) => Kind<F, Option<Item>>
  readonly save: (F: Sync<F>) => (item: Item) => Kind<F, void>
  readonly remove: (F: Sync<F>) => (name: string) => Kind<F, void>
}

// ***** Interpreter for PG *****

class PostgreSQLItemRepository<F extends URIS>
  implements ItemRepository<F, 'Stream'> {
  findAll = (F: Sync<F>) => (): Stream<F, Item> => empty()

  find = (F: Sync<F>) => (name: string): Kind<F, Option<Item>> =>
    F.pure(none as Option<Item>)

  save = (F: Sync<F>) => (item: Item): Kind<F, void> => F.unit()

  remove = (F: Sync<F>) => (name: string): Kind<F, void> => F.unit()
}

// ************************************
// Update: writing program interpreters

type ProgramF<F extends URIS, G extends 'Stream' | 'Array'> = ItemRepository<
  F,
  G
> &
  Monad1<F> &
  Sync<F>

function doublePrices<F extends URIS, G extends 'Stream' | 'Array'>(
  PF: ProgramF<F, G>,
  G: Traversable1<G>,
) {
  return Do(PF)
    .bindL('items', () => {
      const s = PF.findAll(PF)()
      return PF.of(
        G.map<Item, Item>(s, (item) => ({
          ...item,
          price: item.price.valueOf() * 2n,
        })),
      )
    })
    .bindL('saved', ({ items }) => {
      const gfvoid = G.map(items, PF.save(PF)) // G<F<void>>
      return G.sequence(PF)(gfvoid)
    })
    .return(({ saved }) => saved)
}

class ListItemRepository<F extends URIS> implements ItemRepository<F, 'Array'> {
  findAll = (F: Sync<F>) => (): Item[] => []

  find = (F: Sync<F>) => (name: string): Kind<F, Option<Item>> =>
    F.pure(none as Option<Item>)

  save = (F: Sync<F>) => (item: Item): Kind<F, void> => F.unit()

  remove = (F: Sync<F>) => (name: string): Kind<F, void> => F.unit()
}

const programFId: ProgramF<Id.URI, 'Array'> = {
  ...Id.identity,
  ...new ListItemRepository(),
  pure: identity,
  unit: constUndefined,
}

const programFIStream: ProgramF<Id.URI, 'Stream'> = {
  ...Id.identity,
  ...new PostgreSQLItemRepository(),
  pure: identity,
  unit: constUndefined,
}
const resultsId = doublePrices(programFId, array) // void [] 👌🏻
declare const streamTraversable: Traversable1<'Stream'>
const resultsId2: Stream<'Identity', void> = doublePrices(
  programFIStream,
  streamTraversable,
) // void [] 👌🏻
declare const programFStream: ProgramF<'Promise', 'Stream'> // TODO
  // Warn: the return of the function here is NOT narrowed down to Stream<'Promise', void> due to declaration of HKT at line 9
  // The compilation with explicit type annotation succeedes.
;(async () => {
  const resultsStream: Stream<'Promise', void> = await doublePrices(
    programFStream,
    streamTraversable,
  ) // 👌🏻
})()
