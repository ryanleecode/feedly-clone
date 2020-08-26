/* eslint-disable @typescript-eslint/no-namespace */
import { Brand, make } from 'ts-brand'

export interface User {
  id: Brand<number, User>
  name: string
}

export namespace User {
  export type Id = User['id']
  export const Id = make<Id>()
}

export interface Post {
  id: Brand<number, Post>
  authorId: User.Id
  title: string
  body: string
}

export namespace Post {
  export type Id = Post['id']
  export const Id = make<Id>()
}

declare function getPost(id: Post.Id): Promise<Post>
declare function getUser(id: User.Id): Promise<User>
