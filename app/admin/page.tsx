import { getAllPosts } from '@/lib/db/posts'
import { db } from '@/lib/db'
import { readingLogs } from '@/drizzle/schema'
import { sql } from 'drizzle-orm'
import Link from 'next/link'

export default async function AdminDashboard() {
  const allPosts = (await getAllPosts()) || []
  
  // Basic Stats
  const totalViews = allPosts.reduce((acc: number, p: any) => acc + (p.viewCount || 0), 0)
  const publishedCount = allPosts.filter((p: any) => p.status === 'published').length
  const draftCount = allPosts.filter((p: any) => p.status === 'draft').length
  
  // Engagement Metric
  let totalFocusHours = 0
  try {
    const totalFocusSecondsResult = await db
      .select({ total: sql`SUM(${readingLogs.totalSeconds})`.mapWith(Number) as any })
      .from(readingLogs)
    totalFocusHours = Math.floor((totalFocusSecondsResult?.[0]?.total || 0) / 3600)
  } catch (e) {
    console.error('Failed to fetch reading logs', e)
  }

  // Recent Posts
  const recentPosts = [...allPosts].sort((a: any, b: any) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
    return dateB - dateA
  }).slice(0, 5)

  // Top Posts
  const topPosts = [...allPosts].sort((a: any, b: any) => 
    (b.viewCount || 0) - (a.viewCount || 0)
  ).slice(0, 5)

  const stats = [
    { name: 'Total Posts', value: allPosts.length, icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z', color: 'text-blue-600 bg-blue-100' },
    { name: 'Total Views', value: totalViews.toLocaleString(), icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'text-purple-600 bg-purple-100' },
    { name: 'Reading Time', value: `${totalFocusHours}h`, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-600 bg-green-100' },
    { name: 'Drafts', value: draftCount, icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5', color: 'text-yellow-600 bg-yellow-100' },
  ]

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Your content performance and system overview.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/admin/posts" 
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Manage All Posts
          </Link>
          <Link 
            href="/admin/new" 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-lg shadow-gray-200 dark:shadow-none"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create New Article
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.color} dark:bg-opacity-20`}>
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{stat.name}</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
            {/* Subtle background decoration */}
            <div className="absolute -right-4 -bottom-4 h-16 w-16 opacity-[0.03] dark:opacity-[0.05]">
               <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
                  <path d={stat.icon} />
               </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content Area: Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
            <div className="flex items-center justify-between border-b border-gray-50 px-8 py-5 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              <Link href="/admin/posts" className="text-xs font-bold text-primary-600 hover:underline dark:text-primary-400">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-800/50">
                    <th className="px-8 py-4">Title</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {recentPosts.map((post: any) => (
                    <tr key={post.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-8 py-4">
                        <Link href={`/admin/edit/${post.slug}`} className="font-bold text-gray-900 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-1">
                          {post.title}
                        </Link>
                        <p className="text-[10px] text-gray-400 mt-0.5">Updated {new Date(post.updatedAt || post.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                          post.status === 'published' 
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-gray-500">
                        {post.viewCount || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats Grid 2 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
             <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                <div className="space-y-2">
                   <Link href="/admin/media" className="flex items-center justify-between rounded-xl bg-gray-50 p-3 text-sm font-bold hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 transition-all">
                      <span>📁 Media Library</span>
                      <span className="text-gray-400">→</span>
                   </Link>
                   <Link href="/" target="_blank" className="flex items-center justify-between rounded-xl bg-gray-50 p-3 text-sm font-bold hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 transition-all">
                      <span>🌐 View Live Site</span>
                      <span className="text-gray-400">→</span>
                   </Link>
                </div>
             </div>
             <div className="rounded-3xl bg-primary-600 p-6 text-white shadow-xl shadow-primary-200 dark:shadow-none relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Writer Pro Tip</h3>
                  <p className="text-lg font-black leading-tight">Use the AI Panel to generate catchy SEO titles.</p>
                  <Link href="/admin/new" className="mt-4 inline-flex items-center text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 transition-all">
                     Try it now &rarr;
                  </Link>
                </div>
                <div className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20 transform group-hover:scale-110 transition-transform">
                   <svg fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar: Top Performing */}
        <div className="space-y-6">
           <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Performing</h2>
              <div className="space-y-6">
                 {topPosts.map((post: any, idx: number) => (
                    <div key={post.id} className="flex gap-4">
                       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-sm font-black text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                          0{idx + 1}
                       </div>
                       <div className="min-w-0">
                          <Link href={`/admin/edit/${post.slug}`} className="block truncate text-sm font-bold text-gray-900 dark:text-gray-200 hover:text-primary-600 transition-colors">
                             {post.title}
                          </Link>
                          <div className="mt-1 flex items-center gap-3 text-[10px] font-bold text-gray-400">
                             <span className="flex items-center gap-1">👁️ {post.viewCount || 0}</span>
                             <span className="flex items-center gap-1 uppercase tracking-tighter">📅 {new Date(post.date || post.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Newsletter / System Stats placeholder */}
           <div className="rounded-3xl border-2 border-dashed border-gray-100 p-8 text-center dark:border-gray-800">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 dark:bg-gray-800">
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Connect Analytics</p>
              <p className="mt-1 text-[10px] text-gray-400">Google Search Console integration coming soon.</p>
           </div>
        </div>
      </div>
    </div>
  )
}
