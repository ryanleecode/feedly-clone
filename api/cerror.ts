import { fromNullable, none, Option, some, option } from 'fp-ts/lib/Option'
import { ReadonlyRecord } from 'fp-ts/lib/ReadonlyRecord'
import { M, summonFor } from '@morphic-ts/batteries/lib/summoner-ESBST'
import error2Json from 'error-to-json'

// eslint-disable-next-line @typescript-eslint/ban-types
const { summon } = summonFor<{}>({})

export type CError = {
  readonly _type: 'CError'
  readonly name: string
  readonly message: string
  readonly shortMessage: string
  readonly meta: ReadonlyRecord<string, unknown>
  readonly stack: Option<string>
  readonly cause: Option<CError>
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const CError: M<{}, unknown, CError> = summon((F) =>
  F.recursive(
    (CError) =>
      F.interface(
        {
          _type: F.stringLiteral('CError'),
          name: F.string(),
          message: F.string(),
          shortMessage: F.string(),
          meta: F.record(F.string(), F.unknown()),
          stack: F.nullable(F.string()),
          cause: F.nullable(CError),
        },
        'CError',
      ),
    'CErrorRec',
  ),
)

export const of = (message: string): CError => {
  return {
    _type: 'CError',
    name: 'CError',
    message,
    shortMessage: message,
    meta: {},
    stack: fromNullable(Error().stack),
    cause: none,
  }
}

export const withName = (name: string) => (cErr: CError): CError => {
  return { ...cErr, name }
}

export const fromError = (err: Error): CError => ({
  _type: 'CError',
  name: err.name,
  message: err.message,
  shortMessage: err.message,
  meta: error2Json(err),
  stack: fromNullable(err.stack),
  cause: none,
})

export const withCause = (cause: CError) => (cErr: CError): CError => {
  const message = `${cErr.message}: ${cause.message}`
  return {
    ...cErr,
    message,
    stack: option.map(cErr.stack, (stack) =>
      stack.replace(/^.*\n/g, `${message}\n`),
    ),
    cause: some(cause),
  }
}

export const cause = (cErr: CError): Option<CError> => cErr.cause

export const withMeta = (meta: ReadonlyRecord<string, unknown>) => (
  cErr: CError,
): CError => {
  return {
    ...cErr,
    meta: { ...cErr.meta, ...meta },
  }
}
