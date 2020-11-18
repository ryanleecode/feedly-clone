import { isEmail } from 'class-validator'
import { pipe } from 'fp-ts/lib/function'

import * as D from 'io-ts/lib/Decoder'

export type EmailBrand = {
  readonly Email: unique symbol
}

export type Email = string & EmailBrand

export const is = (email: string): email is Email => isEmail(email)

export const decoder = pipe(
  D.string,
  D.refine(is, 'Email'),
  D.withMessage((i) => `"${i}" must be a well formed email`),
)
