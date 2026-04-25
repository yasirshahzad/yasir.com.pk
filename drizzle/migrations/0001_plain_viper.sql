CREATE TYPE "public"."post_status" AS ENUM('draft', 'published', 'archived', 'scheduled');--> statement-breakpoint
CREATE TABLE "post_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"tags" jsonb,
	"author_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "categories" jsonb;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "status" "post_status" DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "canonical_url" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "og_image" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "reading_time" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "view_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "post_revisions" ADD CONSTRAINT "post_revisions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;