import bcrypt from 'bcrypt'
import { flow, unsafeCoerce } from 'fp-ts/lib/function'
import { Reader } from 'fp-ts/lib/Reader'
import { TaskEither, tryCatch } from 'fp-ts/lib/TaskEither'

export type Deps = {
  saltRounds: number
}

// -----------------------------------------------------------------------------
// Hash
// -----------------------------------------------------------------------------

export type HashOperation = (value: string) => TaskEither<Error, string>

export const hash: Reader<Deps, HashOperation> = ({ saltRounds }) => (value) =>
  tryCatch(
    () => bcrypt.hash(value, saltRounds),
    flow<unknown[], Error>(unsafeCoerce),
  )

// -----------------------------------------------------------------------------
// Compare
// -----------------------------------------------------------------------------

export type CompareOperation = (
  plainText: string,
  hash: string,
) => TaskEither<Error, boolean>

export const compare: Reader<unknown, CompareOperation> = () => (
  plainText,
  hash,
) =>
  tryCatch(
    () => bcrypt.compare(plainText, hash),
    flow<unknown[], Error>(unsafeCoerce),
  )
