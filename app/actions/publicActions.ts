'use server'

import { getPostBySlug } from 'lib/db/posts'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'

export async function fetchRenderedPost(slug: string) {
  try {
    const post = await getPostBySlug(slug)
    if (!post || !post.content) {
      return { success: false, error: 'Post not found or empty.' }
    }

    // Use the exact unified pipeline from the main blog route
    // to strictly match rendering and table structures.
    const processedContent = await remark()
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeStringify)
      .process(post.content)

    return { 
      success: true, 
      html: processedContent.toString(),
      title: post.title 
    }
  } catch (error) {
    console.error('Error fetching inline post:', error)
    return { success: false, error: 'Internal Server Error' }
  }
}
