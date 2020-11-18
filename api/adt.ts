/**
 * A sum-type generator. Uses the keys of the passed type as string discriminators
 *
 * Ripped from https://github.com/rjdestigter/ts-adt/blob/default-matching/ADT.ts
 *
 * ```ts
 * type Option<T> = ADT<{
 *   none: {},
 *   some: {value: T}
 * }>
 *
 * type These<A, B> = ADT<{
 *   left: {left: A},
 *   right: {right: B},
 *   both: {left: A, right: B}
 * }>
 * ```
 *
 * @packageDocumentation
 */

/* eslint-disable */

export type ADT<T extends Record<string, {}>> = {
  readonly [K in keyof T]: K extends '_' ? never : { readonly _type: K } & T[K]
}[keyof T]

// Omit type, for TS < 3.5
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

type MatchObj<ADT extends { readonly _type: string }, Z> = {
  readonly [K in ADT['_type']]: (v: ADTMember<ADT, K>) => Z
}

type PartialMatchObj<ADT extends { readonly _type: string }, Z> = Partial<
  MatchObj<ADT, Z>
> & { readonly _: (err: ADT) => Z }

/**
 * Helper type for omitting the '_type' field from values
 */
export type ADTMember<ADT, Type extends string> = Omit<
  Extract<ADT, { readonly _type: Type }>,
  '_type'
>

/**
 * Pattern matching for a sum type defined with ADT
 *
 * ```ts
 * declare const foo: Option<string>
 *
 * pipe(
 *   foo,
 *   match({
 *     none: () => 'none',
 *     some: ({value}) => 'some'
 *   })
 * )
 * ```
 */
export function match<ADT extends { readonly _type: string }, Z>(
  matchObj: MatchObj<ADT, Z> | PartialMatchObj<ADT, Z>,
): (v: ADT) => Z {
  return (v) =>
    (matchObj as any)[v._type] != null
      ? (matchObj as any)[v._type](v)
      : (matchObj as any)['_'](v)
}

/**
 * Item-first version of match, useful for better inference in some circumstances
 *
 * ```ts
 * declare const foo: Option<string>
 *
 * matchI(foo)({
 *   none: () => 'none',
 *   some: ({value}) => 'some'
 * })
 * ```
 */
export function matchI<ADT extends { readonly _type: string }>(
  v: ADT,
): <Z>(matchObj: MatchObj<ADT, Z> | PartialMatchObj<ADT, Z>) => Z {
  return (matchObj) =>
    (matchObj as any)[v._type] != null
      ? (matchObj as any)[v._type](v)
      : (matchObj as any)['_'](v)
}
