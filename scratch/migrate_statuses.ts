import { db } from '../lib/db/index'
import { posts } from '../drizzle/schema'
import { eq, and, sql } from 'drizzle-orm'

async function main() {
    console.log('Migrating post statuses...');
    
    // Set status to 'published' for all posts where draft is false and status is currently 'draft' or null
    // @ts-ignore
    const result = await db.update(posts)
        .set({ status: 'published' })
        // @ts-ignore
        .where(eq(posts.draft, false))
        .returning({ id: posts.id, title: posts.title, status: posts.status });

    console.log(`Updated ${result.length} posts to 'published'.`);
}

main().catch(console.error);
