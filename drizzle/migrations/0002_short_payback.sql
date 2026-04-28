CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" text,
	"content" text NOT NULL,
	"parent_id" integer,
	"is_approved" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "reader_profiles" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "reader_profiles" ADD COLUMN "full_name" text;--> statement-breakpoint
ALTER TABLE "reader_profiles" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "reader_profiles" ADD COLUMN "role" "user_role" DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "reader_profiles" ADD COLUMN "active_focus_session_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "reader_profiles" ADD COLUMN "focus_goal_minutes" integer DEFAULT 25;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_reader_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."reader_profiles"("id") ON DELETE set null ON UPDATE no action;