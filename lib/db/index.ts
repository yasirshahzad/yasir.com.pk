import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../drizzle/schema'

const connectionString = process.env.DATABASE_URL!

// Singleton pattern for database client in Next.js development
const globalForDb = global as unknown as {
  client: postgres.Sql | undefined
}

const client =
  globalForDb.client ??
  postgres(connectionString, {
    prepare: false,
    max: 5,           // allow concurrent queries without contention
    idle_timeout: 20, // release idle connections after 20s
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client
}

export const db = drizzle(client, { schema })
