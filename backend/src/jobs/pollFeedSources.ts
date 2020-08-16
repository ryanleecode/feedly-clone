import { ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither'
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject'
import * as rx from 'rxjs'
import * as rxo from 'rxjs/operators'
import { Cursor, Db, MongoClient } from 'mongodb'
import mongad from 'mongad'
import { FeedSource } from '../models/FeedSource'
import { flow, pipe } from 'fp-ts/lib/function'
import { identity } from 'fp-ts'

interface Order {
  id: number
  productName: string
  price: string
  purchaseDate: Date
}

interface Company {
  id: number
  name: string
  city: string
  countryCode: string
  orders?: Order[]
}

/* export declare const db: Db

export declare function retrieveCompanies(
  limit: number,
  offset: number,
): Promise<Company[]> */

export function pollFeedSources(collectionName: string) {
  return (db: Db) => {
    const controller$ = new BehaviorSubject(0)

    return pipe(
      controller$,
      rxo.mergeMap<number, rx.Observable<Cursor<unknown>>>(
        (batchSize) =>
          rx.of(
            db.collection<FeedSource>(collectionName).find({}, { batchSize }),
          ),
        3,
      ),
    )
  }
}

;(async () => {
  // console.log(orm.em)
  /*   pollFeedSources('feedSource')(db).subscribe(async (cursor) => {
    console.log(await cursor.toArray())
  }) */
})()
