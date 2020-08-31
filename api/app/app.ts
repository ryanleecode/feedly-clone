/**
 * This file is your server entrypoint. Don't worry about its emptyness, Nexus handles everything for you.
 * However, if you need to add settings, enable plugins, schema middleware etc, this is place to do it.
 * Below are some examples of what you can do. Uncomment them to try them out!
 */

/**
 * Change a variety of settings
 */

// import { settings } from 'nexus'
//
// settings.change({
//   server: {
//     port: 4001
//   }
// })

/**
 * Add some schema middleware
 */

// import { schema } from 'nexus'
//
// schema.middleware((_config) => {
//   return async (root, args, ctx, info, next) {
//     ctx.log.trace('before resolver')
//     await next(root, args, ctx, info)
//     ctx.log.trace('after resolver')
//   }
// })

/**
 * Enable the Prisma plugin. (Needs `nexus-plugin-prisma` installed)
 */

import { sequenceS } from 'fp-ts/lib/Apply'
import { on, schema } from 'nexus'
import { constVoid, pipe, unsafeCoerce } from 'fp-ts/lib/function'
import * as R from 'fp-ts/lib/Reader'
import * as Prisma from '@prisma/client'
import RSSParser from 'rss-parser'
import { shield, rule } from 'nexus-plugin-shield'
import * as t from 'io-ts'

import * as FeedSourceRepository from '../repository/interpreter/FeedSourceRepository'
import * as FeedItemRepository from '../repository/interpreter/FeedItemRepository'
import * as WebFeedItemRepository from '../repository/interpreter/WebFeedItemRepository'
import * as UserRepository from '../repository/interpreter/UserRepository'

import * as ObE from 'fp-ts-rxjs/lib/ObservableEither'
import * as FeedService from '../service/FeedService'
import * as UserService from '../service/UserService'
import * as PasswordService from './service/PasswordService'

/**
 * Nexus doesn't understand how to import second-level types during code
 * generation. This is a hack to get it to import our types.
 */
const __UNSAFE_IMPORT__: ObE.ObservableEither<never, never> &
  UserService.SignupOperation &
  UserService.LoginOperation &
  FeedService.RefreshOperation = unsafeCoerce(constVoid)

/**
 * Uncomment the line below and use `Go To Definition` to see the generated types.
 */
// import '@types/typegen-nexus-context/index'

on.start(() => {
  /**
   * This is our dependency tree.
   *
   * We use `(d) => ({ ... })` syntax rather than using type inference with
   * `sequenceS(R.reader)({ ... })` because the latter does not perform type
   * widening.
   */
  const dependencies = pipe(
    {
      db: new Prisma.PrismaClient(),
      rssParser: new RSSParser(),
      passwordService: sequenceS(R.reader)(PasswordService)({
        saltRounds: 10,
      }),
    },
    (d) => ({
      feedItemRepository: sequenceS(R.reader)(FeedItemRepository)(d),
      feedSourceRepository: sequenceS(R.reader)(FeedSourceRepository)(d),
      webFeedItemRepository: sequenceS(R.reader)(WebFeedItemRepository)(d),
      userRepository: sequenceS(R.reader)(UserRepository)(d),
    }),
    (d) => ({
      feedService: sequenceS(R.reader)(FeedService)(d),
      userService: sequenceS(R.reader)(UserService)(d),
    }),
  )

  schema.addToContext(({ req }) => {
    return {
      __UNSAFE_IMPORT__,
      ...dependencies,
    }
  })
})

const permissions = shield({
  rules: { Query: {} },
})

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx: NexusContext, info) => {
    const auth = ctx.req.headers['Authorization']
    pipe(t.string.decode(auth))
    return false
  },
)
