'use server'

import { updatePost, getPostBySlug } from '@/lib/db/posts'
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

export async function fetchPostForExport(slug: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Any logged-in user can export
  if (!user) {
    return { success: false, error: 'Login required.' }
  }

  try {
    const post = await getPostBySlug(slug)
    if (!post) {
      return { success: false, error: 'Post not found.' }
    }

    const tags = (post.tags as string[]) || []
    const authors = (post.authors as string[]) || ['default']

    const frontmatter = [
      '---',
      `title: '${(post.title || '').replace(/'/g, "''")}'`,
      `date: '${post.date || new Date().toISOString()}'`,
      `tags: [${tags.map((t) => `'${t}'`).join(', ')}]`,
      `draft: ${post.draft || false}`,
      `summary: '${(post.summary || '').replace(/'/g, "''")}'`,
      `authors: [${authors.map((a) => `'${a}'`).join(', ')}]`,
      `layout: ${post.layout || 'PostLayout'}`,
      '---',
      '',
    ].join('\n')

    return {
      success: true,
      mdx: frontmatter + (post.content || ''),
      filename: `${slug.split('/').pop() || slug}.mdx`,
    }
  } catch (error) {
    console.error('Failed to fetch post for export:', error)
    return { success: false, error: 'Failed to fetch post.' }
  }
}
