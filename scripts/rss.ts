import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { slug } from 'github-slugger'
import { escape } from 'pliny/utils/htmlEscaper.js'
import siteMetadata from '../data/siteMetadata'
import { getAllPosts, getTagCounts, mapPost } from '../lib/db/posts'

import { BlogPost } from '../types/blog'

const outputFolder = process.env.EXPORT ? 'out' : 'public'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateRssItem = (config: any, post: BlogPost) => `
  <item>
    <guid>${config.siteUrl}/blog/${post.slug}</guid>
    <title>${escape(post.title)}</title>
    <link>${config.siteUrl}/blog/${post.slug}</link>
    ${post.summary ? `<description>${escape(post.summary)}</description>` : ''}
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <author>${config.email} (${config.author})</author>
    ${post.tags ? post.tags.map((t: string) => `<category>${t}</category>`).join('') : ''}
  </item>
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateRss = (config: any, posts: BlogPost[], page = 'feed.xml') => `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${escape(config.title)}</title>
      <link>${config.siteUrl}/blog</link>
      <description>${escape(config.description)}</description>
      <language>${config.language}</language>
      <managingEditor>${config.email} (${config.author})</managingEditor>
      <webMaster>${config.email} (${config.author})</webMaster>
      <lastBuildDate>${posts.length > 0 ? new Date(posts[0].date || '').toUTCString() : new Date().toUTCString()}</lastBuildDate>
      <atom:link href="${config.siteUrl}/${page}" rel="self" type="application/rss+xml"/>
      ${posts.map((post) => generateRssItem(config, post)).join('')}
    </channel>
  </rss>
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateRSS(config: any, allBlogs: BlogPost[], page = 'feed.xml') {
  const publishPosts = allBlogs.filter((post) => post.draft !== true)

  // RSS for blog post
  if (publishPosts.length > 0) {
    const rss = generateRss(config, publishPosts)
    writeFileSync(`./${outputFolder}/${page}`, rss)
  }

  if (publishPosts.length > 0) {
    const tagCounts = await getTagCounts()
    for (const tag of Object.keys(tagCounts)) {
      const filteredPosts = allBlogs.filter((post) =>
        post.tags?.map((t: string) => slug(t)).includes(tag)
      )
      const rss = generateRss(config, filteredPosts, `tags/${tag}/${page}`)
      const rssPath = path.join(outputFolder, 'tags', tag)
      mkdirSync(rssPath, { recursive: true })
      writeFileSync(path.join(rssPath, page), rss)
    }
  }
}

const rss = async () => {
  const rawPosts = await getAllPosts()
  const allBlogs = rawPosts.map(mapPost)
  await generateRSS(siteMetadata, allBlogs)
  console.log('RSS feed generated from PostgreSQL Drizzle ORM...')
}

export default rss
