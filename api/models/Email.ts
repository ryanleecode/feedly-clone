import { Brand, make } from 'ts-brand'
import { none, Option, some } from 'fp-ts/lib/Option'
import emailValidator from 'email-validator'

export type Email = Brand<string, 'Email'>

const Email = make<Email>()

export const validate = (email: string): Option<Email> =>
  emailValidator.validate(email) ? some(Email(email)) : none
