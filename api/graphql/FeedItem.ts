import { schema } from 'nexus'

export const FeedItem = schema.objectType({
  name: 'FeedItem',
  definition(t) {
    t.string('id')
    t.string('title')
    t.string('link')
    t.date('date')
    t.string('content', { nullable: true })
    t.string('author', { nullable: true })
    t.string('image', { nullable: true })
  },
})

schema.extendType({
  type: 'Query',
  definition(t) {
    t.list.field('feed', {
      type: 'FeedItem',
      resolve(_root, _args, ctx) {
        ctx.feedService.refresh
        return [{ id: 'a' }]
      },
    })
  },
})
