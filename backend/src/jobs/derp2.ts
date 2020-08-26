import { Do } from 'fp-ts-contrib/lib/Do'
import { array } from 'fp-ts/lib/Array'
import { Either } from 'fp-ts/lib/Either'
import * as E from 'fp-ts/lib/Either'
import { constUndefined, constVoid, identity, Lazy } from 'fp-ts/lib/function'
import { Kind, URIS } from 'fp-ts/lib/HKT'
import * as Id from 'fp-ts/lib/Identity'
import * as Ob from 'fp-ts-rxjs/lib/Observable'
import * as MOb from 'fp-ts-rxjs/lib/MonadObservable'
import * as T from 'fp-ts/lib/Task'
import { Monad, Monad1 } from 'fp-ts/lib/Monad'
import { none, Option } from 'fp-ts/lib/Option'
import { Traversable1 } from 'fp-ts/lib/Traversable'
import rx, { Observable } from 'rxjs'
import { Functor1 } from 'fp-ts/lib/Functor'



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

interface ItemRepository<F extends URIS, G extends URIS, H extends URIS> {
  /**
   * Here's the "gotcha": you'll have to add explicit parameter to all places,
   * whereas in Scala you have those convenient implicits:
   */
  readonly findAll: () => Kind<G, Kind<H, Item>>
  readonly find: (name: string) => Kind<F, Option<Item>>
  readonly save: (item: Item) => Kind<F, void>
  readonly remove: (name: string) => Kind<F, void>
}

// ***** Interpreters

class ListItemStreamRepository
  implements ItemRepository<'Observable', 'Identity', 'Observable'> {
  findAll = (): Observable<Item> => rx.from([])

  find = (name: string) => rx.of(none)

  save = (item: Item) => rx.of(constVoid())

  remove = (name: string) => rx.of(constVoid())
}

class ListItemArrayRepository
  implements ItemRepository<'Task', 'Task', 'Array'> {
  findAll = () => T.of([])

  find = (name: string) => T.of(none as Option<Item>)

  save = (item: Item) => T.of(constVoid())

  remove = (name: string) => T.of(constVoid())
}

// ************************************
// Update: writing program interpreters

type ProgramF<
  F extends URIS,
  G extends URIS,
  H extends 'Observable' | 'Array'
> = ItemRepository<F, G, H> & Monad1<F>

function doublePrices<
  F extends URIS,
  G extends URIS,
  H extends 'Observable' | 'Array'
>(PF: ProgramF<F, G, H>, G: Functor1<G>, H: Traversable1<H>) {
  return Do(PF)
    .bindL('items', () => {
      const s = PF.findAll()

      return PF.of(
        G.map(s, (a) =>
          H.map(a, (item) => ({
            ...item,
            price: item.price.valueOf() * 2n,
          })),
        ),
      )
    })
    .bindL('saved', ({ items }) => {
      const hfvoid = G.map(items, (a) => H.map(a, PF.save))
      return PF.of(G.map(hfvoid, (a) => H.sequence(PF)(a)))
    })
    .return(({ saved }) => saved)
}

const programTask: ProgramF<'Task', 'Task', 'Array'> = {
  ...T.task,
  ...new ListItemArrayRepository(),
}

const programStream: ProgramF<'Observable', 'Identity', 'Observable'> = {
  ...Ob.observable,
  ...new ListItemStreamRepository(),
}
const resultsId = doublePrices(programTask, T.task, array) // void [] 👌🏻
declare const streamTraversable: Traversable1<'Stream'>
const resultsId2 = doublePrices(programStream, Id.identity, MOb.) // void [] 👌🏻
declare const programFStream: ProgramF<'Promise', 'Stream'> // TODO
  // Warn: the return of the function here is NOT narrowed down to Stream<'Promise', void> due to declaration of HKT at line 9
  // The compilation with explicit type annotation succeedes.
;(async () => {
  const resultsStream: Stream<'Promise', void> = await doublePrices(
    programFStream,
    streamTraversable,
  ) // 👌🏻
})()
