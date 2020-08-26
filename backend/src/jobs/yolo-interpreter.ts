import { Reader } from 'fp-ts/lib/Reader'
import { Db } from 'mongodb'
import { Program } from './yolo'
import * as Ob from 'fp-ts-rxjs/lib/Observable'

export const getObservableInterpreter: Reader<Db, Program<Ob.URI>> = (db) => {
  return {
    ...Ob.observable,
    getFeed: () => {
      throw new Error('not implemented')
    },
    getFeedItems: () => {
      throw new Error('not implemented')
    },
    getFeedSources: () => {
      throw new Error('not implemented')
    },
  }
}
