import { NextRequest, NextResponse } from 'next/server'
import { buildSchema, graphql } from 'graphql'

/**
 * 🧙‍♂️ GraphQL Playground – A tiny experimental portal that lets us poke the
 * posts edge function with typed sticks. The admin panel still speaks REST,
 * but this endpoint gives curious souls a taste of query magic.
 */

// 🛠️ Schema: just enough to learn, not enough to hurt ourselves
const schema = buildSchema(`
  type Post {
    id: ID!
    title: String
    content: String
    slug: String
    content_version: Int
    is_stale: Boolean
  }

  input PostInput {
    title: String
    content: String
    slug: String
  }

  type Query {
    posts: [Post]
    post(id: ID!): Post
  }

  type Mutation {
    createPost(input: PostInput!): Post
    updatePost(id: ID!, input: PostInput!): Post
    deletePost(id: ID!): Boolean
  }
`)

// 🎯 Resolvers – simply proxy to the canonical posts edge function
const root = {
  posts: async () => {
    const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/posts`)
    return res.json()
  },
  post: async ({ id }: { id: string }) => {
    const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/posts?id=${id}`)
    return res.json()
  },
  createPost: async ({ input }: any) => {
    const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    return res.json()
  },
  updatePost: async ({ id, input }: any) => {
    const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/posts?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    return res.json()
  },
  deletePost: async ({ id }: { id: string }) => {
    const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/posts?id=${id}`, {
      method: 'DELETE'
    })
    return res.ok
  }
}

/**
 * 📬 POST handler – receives GraphQL queries and executes them.
 * If a query misbehaves, we gently return the errors instead of
 * letting the server explode 💥.
 */
export async function POST(req: NextRequest) {
  const { query, variables } = await req.json()
  const result = await graphql({ schema, source: query, rootValue: root, variableValues: variables })
  return NextResponse.json(result)
}

// 🤫 No GET handler for now – this playground is BYO GraphiQL.

