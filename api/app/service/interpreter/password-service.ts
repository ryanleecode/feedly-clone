/**
 * A service that hashes and verifies passwords using Argon2
 *
 * Argon2 is modern modern and superior to password hashing algorithms
 * like scrypt and bcrypt.
 *
 * @packageDocumentation
 */

import argon2 from 'argon2'
import { sequenceS } from 'fp-ts/lib/Apply'
import { toError } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import { Reader, reader } from 'fp-ts/lib/Reader'
import { tryCatch } from 'fp-ts/lib/TaskEither'
import * as I from 'fp-ts/lib/Identity'
import { PasswordService } from '../password-service'
import { withCause, fromError, of as CErrorOf } from '../../../cerror'

const hash: Reader<void, PasswordService['hash']> = () => (value) => {
  return tryCatch(
    () => argon2.hash(value),
    flow(
      toError,
      fromError,
      withCause,
      I.ap(CErrorOf('Failed to apply Argon2 password hash')),
    ),
  )
}

type PasswordServiceReader = Reader<void, PasswordService>
export const PasswordServiceReader: PasswordServiceReader = sequenceS(reader)({
  hash,
})
