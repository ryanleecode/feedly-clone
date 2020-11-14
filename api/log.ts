import * as C from 'fp-ts/lib/Console'
import * as D from 'fp-ts/lib/Date'
import { chain, chainFirst, IO } from 'fp-ts/lib/IO'
import { pipe } from 'fp-ts/lib/pipeable'
import format from 'date-fns/fp/format'
import chalk from 'chalk'

type Level = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

type Entry = {
  readonly context: string
  readonly message: string
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

  return `[${date}][${entry.context}][${level}] ${entry.message}`
}

const log = (context: string) => (level: Level) => (message: string) =>
  pipe(
    D.create,
    chain((date) => C.log(showEntry({ message, date, level, context }))),
  )

export type Logger = {
  readonly trace: (message: string) => IO<void>
  readonly debug: (message: string) => IO<void>
  readonly info: (message: string) => IO<void>
  readonly warn: (message: string) => IO<void>
  readonly error: (message: string) => IO<void>
  readonly fatal: (message: string) => IO<void>
}

export const getLogger = (context: string): Logger => ({
  trace: (message: string) => log(context)('TRACE')(message),
  debug: (message: string) => log(context)('DEBUG')(message),
  info: (message: string) => log(context)('INFO')(message),
  warn: (message: string) => log(context)('WARN')(message),
  error: (message: string) => log(context)('ERROR')(message),
  fatal: (message: string) =>
    pipe(
      log(context)('FATAL')(message),
      chainFirst(() => process.exit(1)),
    ),
})
