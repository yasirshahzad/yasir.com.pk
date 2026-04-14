'use server'

import { updatePost } from '@/lib/db/posts'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBlogPostContent(slug: string, content: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Security check: Only the admin can update post content
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return { success: false, error: 'Unauthorized: Admin access required.' }
  }

  try {
    await updatePost(slug, { content })

    // Revalidate the blog paths to reflect changes
    revalidatePath('/blog')
    revalidatePath(`/blog/${slug}`)
    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    console.error('Failed to update blog post content:', error)
    return { success: false, error: 'Failed to update database.' }
  }
}
