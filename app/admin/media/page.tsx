import MediaLibrary from '@/components/MediaLibrary'

export default function AdminMediaPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your uploaded assets and images.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        <MediaLibrary onSelect={(url) => {
            window.open(url, '_blank')
        }} />
      </div>
      
      <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
            Click on an image in the library to view it in full size. These assets are stored securely in Supabase Storage.
          </p>
        </div>
      </div>
    </div>
  )
}
