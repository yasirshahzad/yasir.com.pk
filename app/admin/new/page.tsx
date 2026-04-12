import PostForm from '../PostForm'
import SectionContainer from '@/components/SectionContainer'
import PageTitle from '@/components/PageTitle'

export default function NewPost() {
  return (
    <SectionContainer>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <PageTitle>New Blog Post</PageTitle>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            Create a new story for your readers
          </p>
        </div>
        <div className="py-8">
          <PostForm />
        </div>
      </div>
    </SectionContainer>
  )
}
