import { pgTable, serial, text, timestamp, boolean, jsonb, varchar, integer, date } from 'drizzle-orm/pg-core';

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

export const readerProfiles = pgTable('reader_profiles', {
  id: text('id').primaryKey(), // UUID string, securely pinned in the user's browser cookie
  currentStreak: integer('current_streak').default(0), 
  longestStreak: integer('longest_streak').default(0),
  lastActiveDate: date('last_active_date'), // 'YYYY-MM-DD'
  createdAt: timestamp('created_at').defaultNow(),
});

export const readingLogs = pgTable('reading_logs', {
  id: serial('id').primaryKey(),
  readerId: text('reader_id').notNull(), // Links to reader_profiles.id
  date: date('date').notNull(), // 'YYYY-MM-DD'
  totalSeconds: integer('total_seconds').default(0),
});

export const readerNotes = pgTable('reader_notes', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Links to reader_profiles.id
  quote: text('quote').notNull(),
  sourceUrl: text('source_url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
