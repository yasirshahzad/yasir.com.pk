import { pgTable, serial, text, timestamp, boolean, jsonb, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  date: text('date'),
  tags: jsonb('tags').$type<string[]>(),
  draft: boolean('draft').default(false),
  authors: jsonb('authors').$type<string[]>(),
  layout: text('layout'),
  images: jsonb('images').$type<string[]>(),
  summary: text('summary'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
