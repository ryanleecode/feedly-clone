import { Brand, make } from 'ts-brand'

import { isEmail } from 'class-validator'
import { pipe } from 'fp-ts/lib/function'

import * as D from 'io-ts/lib/Decoder'

export type Email = Brand<string, 'Email'>

const Email = make<Email>()

export const is = (email: string): email is Email => isEmail(email)

export const decoder = pipe(
  D.string,
  D.refine(is, 'Email'),
  D.withMessage((i) => `\"${i}\" must be a well formed email`),
)
