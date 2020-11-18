import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import * as IO from 'fp-ts/lib/IO'
import * as D from 'io-ts/lib/Decoder'
import { constVoid, flow, pipe } from 'fp-ts/lib/function'
import fastify from 'fastify'
import { kill } from 'cross-port-killer'
import dotenv from 'dotenv'

import { server } from '../server'
import { getLogger } from '../log'
import * as Env from '../env'

const log = getLogger('feedly_clone::app')

const start = pipe(
  () => dotenv.config(),
  IO.bind('app', () => IO.of(fastify())),
  IO.bind('fastifyInstance', ({ app }) =>
    IO.of(app.register(server.createHandler())),
  ),
  TE.fromIO,
  TE.bindW('env', () =>
    pipe(Env.decode(), TE.mapLeft(flow(D.draw, E.toError))),
  ),
  TE.chainFirstW(({ env }) => TE.tryCatch(() => kill(env.PORT), E.toError)),
  TE.bindW('address', ({ app, env }) =>
    TE.tryCatch(() => app.listen(env.PORT), E.toError),
  ),
  TE.chainFirstW(({ address }) =>
    TE.fromIO(log.info(`🚀 Server ready at ${address}/graphql`)),
  ),
  TE.map(constVoid),
  TE.orElse((err) => TE.fromIO(log.fatal(`Failed to start server: ${err}`))),
)

const shutdownServer = pipe(
  log.info(`Server is shutting down.`),
  TE.fromIO,
  TE.chainFirstW(() => TE.tryCatch(() => server.stop(), E.toError)),
)

process.on('SIGINT', () =>
  pipe(
    log.info(`SIGINT signal received.`),
    TE.fromIO,
    TE.chainFirstW(() => shutdownServer),
  )(),
)

process.on('SIGTERM', () =>
  pipe(
    log.info(`SIGTERM signal received.`),
    TE.fromIO,
    TE.chainFirstW(() => shutdownServer),
    TE.chainFirstW(() => TE.fromIO(() => process.exit(1))),
  )(),
)

start()
