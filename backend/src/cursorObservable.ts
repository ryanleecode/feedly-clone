import { Cursor } from 'mongodb'
import { EMPTY, from, Observable } from 'rxjs'
import { concatMap, expand, tap } from 'rxjs/operators'

export function cursor$<T>(cursor: Cursor<T>): Observable<T> {
  let counter = 0

  const next$ = () =>
    from(cursor.hasNext()).pipe(
      tap({ next: () => console.log(counter++, 'before') }),
      concatMap((hasNext) =>
        hasNext ? from(<Promise<T>>cursor.next()) : EMPTY,
      ),
      tap({ next: () => console.log(counter++, 'after') }),
    )

  return next$().pipe(expand(() => next$()))
}
