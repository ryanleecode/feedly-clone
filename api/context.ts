import { PrismaClient } from '@prisma/client'
import { PasswordService, UserService } from './app/service'
import {
  PasswordServiceReader,
  UserServiceReader,
} from './app/service/interpreter'
import { UserRepository } from './repository'
import { UserRepositoryReader } from './repository/interpreter'

const db = new PrismaClient()

const passwordService: PasswordService = PasswordServiceReader()

const userRepository: UserRepository = UserRepositoryReader({
  db,
  passwordService,
})

const userService: UserService = UserServiceReader({ userRepository })

export type Context = {
  readonly userService: UserService
}

export const createContext = (): Context => ({
  userService,
})
