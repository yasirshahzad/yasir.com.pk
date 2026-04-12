require('dotenv').config();
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { pgTable, serial, text, timestamp, boolean, jsonb } = require('drizzle-orm/pg-core');
const fs = require('fs');
const path = require('path');

// Define schema inline for the script
const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  date: text('date'),
  tags: jsonb('tags'),
  draft: boolean('draft').default(false),
  authors: jsonb('authors'),
  layout: text('layout'),
  images: jsonb('images'),
  summary: text('summary'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function seed() {
  console.log('Reading blog_data.json...');
  const dataPath = path.join(__dirname, '../data/blog_data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const blogPosts = JSON.parse(rawData);

  console.log(`Found ${blogPosts.length} posts. Syncing to Supabase...`);

  for (const post of blogPosts) {
    try {
      await db.insert(posts).values({
        slug: post.slug,
        title: post.title,
        date: post.date,
        tags: post.tags,
        draft: post.draft === 'true' || post.draft === true,
        authors: post.authors,
        layout: post.layout,
        images: post.images,
        summary: post.summary,
        content: post.content,
      }).onConflictDoUpdate({
        target: posts.slug,
        set: {
          title: post.title,
          date: post.date,
          tags: post.tags,
          draft: post.draft === 'true' || post.draft === true,
          authors: post.authors,
          layout: post.layout,
          images: post.images,
          summary: post.summary,
          content: post.content,
          updatedAt: new Date(),
        }
      });
      console.log(`✅ Synced: ${post.slug}`);
    } catch (error) {
      console.error(`❌ Failed to sync ${post.slug}:`, error.message);
    }
  }

  console.log('Seeding completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
