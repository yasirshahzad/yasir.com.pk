-- Migration: add highlight_text and post_title to reader_notes
-- Run this against your Supabase / Postgres database

ALTER TABLE "reader_notes"
  ADD COLUMN IF NOT EXISTS "highlight_text" text,
  ADD COLUMN IF NOT EXISTS "post_title" text;
