import { db } from '../lib/db/index'
import { posts } from '../drizzle/schema'

async function main() {
    const allPosts = await db.select({ slug: posts.slug, title: posts.title }).from(posts);
    console.log(JSON.stringify(allPosts, null, 2));
}

main().catch(console.error);
