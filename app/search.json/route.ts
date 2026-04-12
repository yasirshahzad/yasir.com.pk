import { NextResponse } from 'next/server'
import { getAllPosts, mapPost } from 'lib/db/posts'

// Keep the search index highly cached since blog posts don't change by the minute.
// You can lower this if you want instant indexing, but standard SSG is 1 hour default
export const revalidate = 3600

export async function GET() {
  try {
    const rawPosts = await getAllPosts()
    
    // Map database posts into a lightweight JSON array for KBar search index
    const searchData = rawPosts.map((post) => {
      const mapped = mapPost(post)
      return {
        id: mapped.slug,
        title: mapped.title,
        date: mapped.date,
        tags: mapped.tags,
        summary: mapped.summary,
        path: mapped.path,
        slug: mapped.slug,
      }
    })

    return NextResponse.json(searchData)
  } catch (error) {
    console.error('Error generating search.json:', error)
    return NextResponse.json([], { status: 500 })
  }
}
