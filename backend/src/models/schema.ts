import { MongoJSONSchema4 } from 'mongodb-json-schema'

export type Index<K extends string = string> = {
  name: K
  unique?: boolean
}

export type Schema<K extends string = string> = {
  indices?: Index<K>[]
  $jsonSchema: MongoJSONSchema4<K>
}
