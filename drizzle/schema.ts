import { pgTable, serial, text, timestamp, boolean, jsonb, varchar, integer, date, pgEnum } from 'drizzle-orm/pg-core';

export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived', 'scheduled']);

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
  categories: jsonb('categories').$type<string[]>(),
  draft: boolean('draft').default(false), // Keeping for backward compatibility
  status: postStatusEnum('status').default('draft'),
  authors: jsonb('authors').$type<string[]>(),
  layout: text('layout'),
  images: jsonb('images').$type<string[]>(),
  summary: text('summary'),
  content: text('content').notNull(),
  
  // SEO & Social
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  canonicalUrl: text('canonical_url'),
  ogImage: text('og_image'),
  
  // Analytics & Metadata
  readingTime: integer('reading_time'),
  viewCount: integer('view_count').default(0),
  
  // Publishing
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const postRevisions = pgTable('post_revisions', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  summary: text('summary'),
  tags: jsonb('tags').$type<string[]>(),
  authorId: text('author_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const readerProfiles = pgTable('reader_profiles', {
  id: text('id').primaryKey(), // UUID string, securely pinned in the user's browser cookie
  currentStreak: integer('current_streak').default(0), 
  longestStreak: integer('longest_streak').default(0),
  lastActiveDate: date('last_active_date'), // 'YYYY-MM-DD'
  activeFocusSessionStartedAt: timestamp('active_focus_session_started_at'),
  focusGoalMinutes: integer('focus_goal_minutes').default(25),
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
  highlightText: text('highlight_text'), // The exact selected text for deep-link re-highlighting
  postTitle: text('post_title'),         // Human-readable title of the source post
  createdAt: timestamp('created_at').defaultNow(),
});

