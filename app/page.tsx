import { getAllPosts, mapPost } from 'lib/db/posts'
import Main from './Main'

export default async function Page() {
  const allDbPosts = await getAllPosts()
  const posts = allDbPosts.map(mapPost)
  return <Main posts={posts} />
}
