import { PrismaClient } from '@prisma/client'
import { PasswordService } from './app/service'
import { PasswordServiceReader } from './app/service/interpreter'
import { UserRepository } from './repository'
import { UserRepositoryReader } from './repository/interpreter'
import { UserService } from './service'
import { UserServiceReader } from './service/interpreter'

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
