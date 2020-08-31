import { schema } from 'nexus'

schema.mutationType({
  nonNullDefaults: {
    input: true,
    output: true,
  },
  definition() {
    // noop
  },
})
