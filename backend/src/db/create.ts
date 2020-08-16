import dotenv from 'dotenv-safe'
import { MongoClient } from 'mongodb'
import { schema as feedSourceSchema } from '../models/FeedSource'
import { schema as feedItemSchema } from '../models/FeedItem'

dotenv.config()

async function main() {
  try {
    const client = await MongoClient.connect(
      `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}`,
      { useNewUrlParser: true, useUnifiedTopology: true },
    )

    const db = client.db(`${process.env.DB_NAME}`)

    if (process.env.NODE_ENV !== 'production') {
      const collections = await db.collections()
      await Promise.all(collections.map((collection) => collection.drop()))
    }

    const collections = [
      { name: 'FeedSource', schema: feedSourceSchema },
      { name: 'FeedItem', schema: feedItemSchema },
    ]
    await Promise.all(
      collections.map(({ name, schema }) =>
        db.createCollection(name, {
          validator: {
            $jsonSchema: schema,
          },
        }),
      ),
    )

    console.log('?')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
