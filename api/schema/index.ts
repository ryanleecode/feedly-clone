import * as path from 'path'
import * as NexusSchema from '@nexus/schema'
import { nexusPrisma } from 'nexus-plugin-prisma'
import { Mutation } from './mutation'
import { User } from './user'
import * as SignUp from './sign-up'
import * as Validation from './validation'

export const schema = NexusSchema.makeSchema({
  shouldExitAfterGenerateArtifacts:
    process.env.NEXUS_SHOULD_EXIT_AFTER_GENERATE_ARTIFACTS === 'true',
  plugins: [
    nexusPrisma({
      experimentalCRUD: true,
    }),
  ],
  outputs: {
    typegen: path.join(
      __dirname,
      '../../node_modules/@types/nexus-typegen/index.d.ts',
    ),
    schema: path.join(__dirname, '../../schema.graphql'),
  },
  typegenAutoConfig: {
    contextType: 'Context.Context',
    sources: [
      {
        source: '.prisma/client',
        alias: 'prisma',
      },
      {
        source: require.resolve('../context'),
        alias: 'Context',
      },
    ],
  },
  types: [User, Mutation, ...SignUp.types, ...Validation.types],
  features: {
    abstractTypeStrategies: {
      isTypeOf: false,
      resolveType: false,
      __typename: true,
    },
  },
})
