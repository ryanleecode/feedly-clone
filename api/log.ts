import * as C from 'fp-ts/lib/Console'
import * as D from 'fp-ts/lib/Date'
import { chain, chainFirst, IO } from 'fp-ts/lib/IO'
import { pipe } from 'fp-ts/lib/pipeable'
import format from 'date-fns/fp/format'
import chalk from 'chalk'
import { CError } from './cerror'

type Level = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

type Entry = {
  readonly context: string
  readonly message: string
  readonly err?: CError
  readonly date: Date
  readonly level: Level
}

const levelColor = (level: Level): chalk.Chalk => {
  switch (level) {
    case 'TRACE':
      return chalk.blackBright
    case 'DEBUG':
      return chalk.grey
    case 'INFO':
      return chalk.green
    case 'WARN':
      return chalk.yellow
    case 'ERROR':
      return chalk.red
    case 'FATAL':
      return chalk.redBright
  }
}

function showEntry(entry: Entry): string {
  const date = format('yyyy-MM-dd kk:mm:ss')(entry.date)
  const level = levelColor(entry.level)(entry.level)

  return (
    `[${date}][${entry.context}][${level}] ${entry.message}` +
    (entry.err ? `: ${entry.err?.message}` : '')
  )
}

const log = (context: string) => (level: Level) => (message: string) => (
  err?: CError,
) => {
  return pipe(
    D.create,
    chain((date) => C.log(showEntry({ message, date, level, context, err }))),
  )
}

export type Logger = {
  readonly trace: (message: string) => IO<void>
  readonly debug: (message: string) => IO<void>
  readonly info: (message: string) => IO<void>
  readonly warn: (message: string) => IO<void>
  readonly error: (message: string, err?: CError) => IO<void>
  readonly fatal: (message: string, err?: CError) => IO<void>
}

export const getLogger = (context: string): Logger => ({
  trace: (message) => log(context)('TRACE')(message)(),
  debug: (message) => log(context)('DEBUG')(message)(),
  info: (message) => log(context)('INFO')(message)(),
  warn: (message) => log(context)('WARN')(message)(),
  error: (message, err) => log(context)('ERROR')(message)(err),
  fatal: (message, err) =>
    pipe(
      log(context)('FATAL')(message)(err),
      chainFirst(() => process.exit(1)),
    ),
})
