import { getPostBySlug } from '@/lib/db/posts'
import PostForm from '../../PostForm'
import SectionContainer from '@/components/SectionContainer'
import PageTitle from '@/components/PageTitle'
import { notFound } from 'next/navigation'

export default async function EditPost(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return notFound()
  }

  return (
    <SectionContainer>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <PageTitle>Edit: {post.title}</PageTitle>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            Current Slug: {post.slug}
          </p>
        </div>
        <div className="py-8">
          <PostForm post={post} isEditing={true} />
        </div>
      </div>
    </SectionContainer>
  )
}
