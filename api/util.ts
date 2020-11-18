import { pipe } from 'fp-ts/lib/function'
import { swap, TaskEither, chainFirstW, chain } from 'fp-ts/lib/TaskEither'

export const handleError = <E, U>(fe: (e: E) => TaskEither<E, U>) => <A>(
  te: TaskEither<E, A>,
): TaskEither<E, A> => {
  return pipe(
    swap(te),
    chainFirstW(fe),
    swap,
    chain(() => te),
  )
}
