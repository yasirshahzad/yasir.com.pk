import { getAuthorBySlug } from '@/lib/db/authors'
import AuthorLayout from '@/layouts/AuthorLayout'
import { genPageMetadata } from 'app/seo'
import { MDXRemote } from 'next-mdx-remote/rsc'

export const metadata = genPageMetadata({
  title: 'About',
  description: 'Learn more about Muhammad Yasir, Full Stack Software Engineer specializing in web, mobile, and cloud software development.',
  path: 'about',
})

export default function Page() {
  const author = getAuthorBySlug('default')

  if (!author) {
    return null
  }

  return (
    <AuthorLayout content={author as any}>
      {author.content ? (
        <p className="text-lg leading-8 text-gray-700 dark:text-gray-300">
          {author.content}
        </p>
      ) : null}
    </AuthorLayout>
  )
}
