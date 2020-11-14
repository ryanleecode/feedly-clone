import { ApolloServer } from 'apollo-server-fastify'
import { createContext } from './context'
import { schema } from './schema'

export const server = new ApolloServer({
  context: createContext(),
  schema,
})
