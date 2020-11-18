import * as TE from 'fp-ts/lib/TaskEither'
import { CError } from '../../cerror'

export type PasswordService = {
  readonly hash: (value: string) => TE.TaskEither<CError, string>
}
