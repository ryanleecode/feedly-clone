import dotenv from 'dotenv-safe'
import { MongoClient } from 'mongodb'
import { schema as feedSourceSchema } from '../models/FeedSource'
import { schema as feedItemSchema } from '../models/FeedItem'
import { Schema } from '../models/schema'

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

    const collectionNames: Array<{ name: string; schema: Schema<string> }> = [
      { name: 'FeedSource', schema: feedSourceSchema },
      {
        name: 'FeedItem',
        schema: feedItemSchema,
      },
    ]
    await Promise.all(
      collectionNames.map(
        async ({ name, schema: { $jsonSchema, indices = [] } }) => {
          const collection = await db.createCollection(name, {
            validator: {
              $jsonSchema,
            },
          })

          await Promise.all(
            indices.map(({ name, unique }) =>
              collection.createIndex({ [name]: 1 }, { unique }),
            ),
          )
        },
      ),
    )
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
