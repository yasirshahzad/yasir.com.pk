import { MetadataRoute } from 'next'
import { getAllPosts, getTagCounts } from '@/lib/db/posts'
import siteMetadata from '@/data/siteMetadata'
import { slug } from 'github-slugger'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = siteMetadata.siteUrl
  const now = new Date()
  const allDbPosts = await getAllPosts()

  const blogRoutes: MetadataRoute.Sitemap = allDbPosts
    .filter((post) => {
      if (post.draft) return false
      if (post.status === 'scheduled' && post.publishedAt && new Date(post.publishedAt) > now) {
        return false
      }
      return true
    })
    .map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || new Date(post.date!),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  const staticRoutes: MetadataRoute.Sitemap = ['', 'blog', 'projects', 'about', 'tags'].map((route) => ({
    url: route ? `${siteUrl}/${route}` : siteUrl,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }))

  const tagCounts = await getTagCounts()
  const tagRoutes: MetadataRoute.Sitemap = Object.keys(tagCounts).map((t) => ({
    url: `${siteUrl}/tags/${slug(t)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...tagRoutes, ...blogRoutes]
}
