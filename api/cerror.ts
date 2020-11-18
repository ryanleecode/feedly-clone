import { none, Option, some } from 'fp-ts/lib/Option'
import { ReadonlyRecord } from 'fp-ts/lib/ReadonlyRecord'

export type CError = {
  readonly _type: 'CError'
  readonly name: string
  readonly message: string
  readonly shortMessage: string
  readonly meta: ReadonlyRecord<string, unknown>
  readonly stack: string
  readonly cause: Option<Error>
}

export const of = (message: string): CError => {
  return {
    _type: 'CError',
    name: 'CError',
    message,
    shortMessage: message,
    meta: {},
    stack: Error().stack ?? '',
    cause: none,
  }
}

export const withName = (name: string) => (cErr: CError): CError => {
  return { ...cErr, name }
}

export const withCause = (cause: Error) => (cErr: CError): CError => {
  const message = `${cErr.message}: ${cause.message}`
  return {
    ...cErr,
    message,
    stack: cErr.stack.replace(/^.*\n/g, `${message}\n`),
    cause: some(cause),
  }
}

export const cause = (cErr: CError): Option<Error> => cErr.cause

export const withMeta = (meta: ReadonlyRecord<string, unknown>) => (
  cErr: CError,
): CError => {
  return {
    ...cErr,
    meta: { ...cErr.meta, ...meta },
  }
}
