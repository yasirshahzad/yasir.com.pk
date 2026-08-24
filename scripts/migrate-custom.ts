import 'dotenv/config';
import postgres from 'postgres';

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = postgres(connectionString);

  try {
    console.log('Running custom migration to add missing columns to reader_profiles...');

    // Add email column
    try {
      await sql`ALTER TABLE "reader_profiles" ADD COLUMN "email" text;`;
      console.log('Added email column');
    } catch (e: any) {
      if (e.code === '42701') console.log('Column email already exists');
      else throw e;
    }

    // Add full_name column
    try {
      await sql`ALTER TABLE "reader_profiles" ADD COLUMN "full_name" text;`;
      console.log('Added full_name column');
    } catch (e: any) {
      if (e.code === '42701') console.log('Column full_name already exists');
      else throw e;
    }

    // Add avatar_url column
    try {
      await sql`ALTER TABLE "reader_profiles" ADD COLUMN "avatar_url" text;`;
      console.log('Added avatar_url column');
    } catch (e: any) {
      if (e.code === '42701') console.log('Column avatar_url already exists');
      else throw e;
    }

    // Create user_role type if not exists
    try {
      await sql`CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');`;
      console.log('Created user_role enum');
    } catch (e: any) {
      if (e.code === '42710') console.log('Type user_role already exists');
      else throw e;
    }

    // Add role column
    try {
      await sql`ALTER TABLE "reader_profiles" ADD COLUMN "role" "user_role" DEFAULT 'user';`;
      console.log('Added role column');
    } catch (e: any) {
      if (e.code === '42701') console.log('Column role already exists');
      else throw e;
    }

    // Add active_focus_session_started_at column
    try {
      await sql`ALTER TABLE "reader_profiles" ADD COLUMN "active_focus_session_started_at" timestamp;`;
      console.log('Added active_focus_session_started_at column');
    } catch (e: any) {
      if (e.code === '42701') console.log('Column active_focus_session_started_at already exists');
      else throw e;
    }

    // Add focus_goal_minutes column
    try {
      await sql`ALTER TABLE "reader_profiles" ADD COLUMN "focus_goal_minutes" integer DEFAULT 25;`;
      console.log('Added focus_goal_minutes column');
    } catch (e: any) {
      if (e.code === '42701') console.log('Column focus_goal_minutes already exists');
      else throw e;
    }

    // Add comments table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "comments" (
            "id" serial PRIMARY KEY NOT NULL,
            "post_id" integer NOT NULL,
            "user_id" text,
            "content" text NOT NULL,
            "parent_id" integer,
            "is_approved" boolean DEFAULT true,
            "created_at" timestamp DEFAULT now()
        );
      `;
      console.log('Created comments table');
    } catch (e: any) {
      console.log('Error creating comments table:', e.message);
    }

    // Add constraints
    try {
      await sql`ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;`;
      console.log('Added post_id constraint');
    } catch (e: any) {
      if (e.code === '42710') console.log('Constraint comments_post_id_posts_id_fk already exists');
      else console.log('Error adding constraint:', e.message);
    }

    try {
      await sql`ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_reader_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."reader_profiles"("id") ON DELETE set null ON UPDATE no action;`;
      console.log('Added user_id constraint');
    } catch (e: any) {
      if (e.code === '42710') console.log('Constraint comments_user_id_reader_profiles_id_fk already exists');
      else console.log('Error adding constraint:', e.message);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

run();
