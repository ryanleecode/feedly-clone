import { ApolloServer, gql } from 'apollo-server'
import { yolo } from './graphql/resolvers'

// The GraphQL schema
const typeDefs = gql`
  type Query {
    "A simple type for getting started!"
    hello: String
  }
`

const server = new ApolloServer({
  typeDefs,
  resolvers: yolo('asdf'),
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
