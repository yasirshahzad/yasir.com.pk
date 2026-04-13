import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/db/posts'
import siteMetadata from '@/data/siteMetadata'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = siteMetadata.siteUrl
  const allDbPosts = await getAllPosts()

  const blogRoutes = allDbPosts
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || new Date(post.date!),
    }))

  const routes = ['', 'blog', 'projects', 'tags'].map((route) => ({
    url: `${siteUrl}/${route}`,
    lastModified: new Date(),
  }))

  return [...routes, ...blogRoutes]
}
