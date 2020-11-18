import { objectType } from '@nexus/schema'
import { signUp, SignUpInput } from './sign-up'

export const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.field('signUp', {
      type: 'SignUpPayload',
      args: {
        input: SignUpInput,
      },
      resolve: signUp,
    })
  },
})
