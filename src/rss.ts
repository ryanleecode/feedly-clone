import Parser, { Output } from 'rss-parser'
import { pipe } from 'fp-ts/lib/function'
import { task, cmd } from 'elm-ts/lib'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'

const parser = new Parser()

export type ParserOutput = Output

function wrap(s1: string) {
  return (s2: string) => {
    return `${s1}: ${s2}`
  }
}

export function parseURL<T>(
  handler: (output: E.Either<E.Either<unknown, string>, ParserOutput>) => T,
) {
  return (url: string): cmd.Cmd<T> => {
    return pipe(
      TE.tryCatch(
        () => parser.parseURL(url),
        (err): E.Either<unknown, string> => {
          const message = `failed to parse rss feed from ${url}`

          if (err instanceof Error) {
            return pipe(err.message, wrap(message), E.right)
          } else if (typeof err === 'string') {
            return pipe(err, wrap(message), E.right)
          }

          return E.left(err)
        },
      ),
      task.attempt(handler),
    )
  }
}
