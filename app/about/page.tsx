import { getAuthorBySlug } from 'lib/db/authors'
import AuthorLayout from '@/layouts/AuthorLayout'
import { genPageMetadata } from 'app/seo'
import { MDXRemote } from 'next-mdx-remote/rsc'

export const metadata = genPageMetadata({ title: 'About' })

export default function Page() {
  const author = getAuthorBySlug('default')

  if (!author) {
    return null
  }

  // Assuming author back-matter/content might be in mdx if it was before
  // But for now, we'll just render the layout with the meta data
  // If there's extra content in the author .mdx, we'd need to extract it
  
  return (
    <>
      <AuthorLayout content={author as any}>
        {/* If the author file has a body, we'd render it here. For now keeping it simple */}
      </AuthorLayout>
    </>
  )
}
