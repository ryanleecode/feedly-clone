/**
 * Input validation for io-ts Decoders. Validation logic ripped from io-ts.
 * https://github.com/gcanti/io-ts/blob/master/src/Decoder.ts#L577
 *
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-loop-statement */
/* eslint-disable functional/prefer-readonly-type */
import { DecodeError } from 'io-ts/lib/Decoder'
import * as DE from 'io-ts/lib/DecodeError'
import * as A from 'fp-ts/lib/Array'
import { interfaceType } from '@nexus/schema'
import { flow } from 'fp-ts/lib/function'

type Tree<A> = {
  readonly value: A
  readonly forest: ReadonlyArray<Tree<A>>
}

const make = (
  value: string,
  forest: Array<Tree<string>> = A.empty,
): Tree<string> => ({
  value,
  forest,
})

function getErrorValues(forest: ReadonlyArray<Tree<string>>): Array<string> {
  return forest.flatMap((x) => {
    return x.forest.length > 0
      ? [x.value, ...getErrorValues(x.forest)]
      : [x.value]
  })
}

const toTree: (e: DE.DecodeError<string>) => Tree<string> = DE.fold({
  Leaf: (input, error) =>
    make(`cannot decode ${JSON.stringify(input)}, should be ${error}`),
  Key: (key, kind, errors) =>
    make(`${kind} property "${key}"`, toForest(errors)),
  Index: (index, kind, errors) =>
    make(`${kind} index ${index}`, toForest(errors)),
  Member: (index, errors) => make(`member ${index}`, toForest(errors)),
  Lazy: (id, errors) => make(`lazy type ${id}`, toForest(errors)),
  Wrap: (error, errors) => make(error, toForest(errors)),
})

const toForest = (err: DecodeError): Array<Tree<string>> => {
  const stack = [err]
  const res = []

  while (A.isNonEmpty(stack)) {
    const current = stack.pop()!
    switch (current._tag) {
      case 'Of':
        res.push(toTree(current.value))
        break
      case 'Concat':
        stack.push(current.right)
        stack.push(current.left)
    }
  }

  return res
}

export const mapDecoderError: (err: DecodeError) => Array<string> = flow(
  toForest,
  getErrorValues,
)

export const ValidationError = interfaceType({
  name: 'ValidationError',
  definition(t) {
    t.string('message')
    t.list.string('errors')
  },
  nonNullDefaults: { input: true, output: true },
})

export const types = [ValidationError]
