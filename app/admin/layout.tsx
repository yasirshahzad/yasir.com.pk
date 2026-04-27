import Link from 'next/link'
import { redirect } from 'next/navigation'
import { assertAdmin } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user
  try {
    user = await assertAdmin()
  } catch (e) {
    redirect('/login')
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      name: 'Blog Posts',
      href: '/admin/posts',
      icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM14 2v4a2 2 0 002 2h4',
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      name: 'Media Library',
      href: '/admin/media',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transition-transform dark:bg-gray-900">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-gray-100 dark:border-gray-800">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-xl">Y</div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Yasir Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center rounded-xl px-3 py-2 text-sm font-bold text-gray-600 transition-all hover:bg-primary-50 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
              >
                <svg
                  className="mr-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-primary-500 dark:text-gray-500 dark:group-hover:text-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                  {user.email}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest">Administrator</p>
              </div>
            </div>
            <form action="/login/actions" method="POST" className="mt-2">
                <button 
                  type="submit" 
                  formAction={async () => { 'use server'; const { logout } = await import('@/app/login/actions'); await logout(); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
