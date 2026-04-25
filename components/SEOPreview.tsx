'use client'

import React from 'react'

interface SEOPreviewProps {
  title: string
  summary: string
  slug: string
  image?: string
}

export default function SEOPreview({ title, summary, slug, image }: SEOPreviewProps) {
  const url = `yasir.com.pk/blog/${slug}`
  const displayTitle = title || 'Untitled Post'
  const displaySummary =
    summary || 'No description provided. Add a summary to improve SEO and social sharing...'
  const displayImage = image || 'https://yasir.com.pk/static/images/social-banner.png'

  return (
    <div className="space-y-10 p-2">
      {/* ── Google Search Preview ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          Google Search Result
        </h3>
        <div className="max-w-[600px] rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-1 truncate text-[14px] text-[#202124] dark:text-[#bdc1c6]">
            https://{url}
          </div>
          <div className="mb-1 cursor-pointer truncate text-[20px] font-medium text-[#1a0dab] hover:underline dark:text-[#8ab4f8]">
            {displayTitle}
          </div>
          <div className="line-clamp-2 text-[14px] leading-relaxed text-[#4d5156] dark:text-[#bdc1c6]">
            {displaySummary}
          </div>
        </div>
      </section>

      {/* ── Twitter / X Card ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          Twitter (X) Preview
        </h3>
        <div className="max-w-[500px] overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
          <div className="relative flex aspect-[1.91/1] w-full items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-900">
            <img src={displayImage} alt="Social banner" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-1 border-t border-gray-100 p-3 dark:border-gray-800">
            <div className="text-[12px] tracking-tight text-gray-500 uppercase">yasir.com.pk</div>
            <div className="truncate text-[14px] font-bold text-gray-900 dark:text-gray-100">
              {displayTitle}
            </div>
            <div className="line-clamp-2 text-[14px] leading-snug text-gray-500 dark:text-gray-400">
              {displaySummary}
            </div>
          </div>
        </div>
      </section>

      {/* ── LinkedIn Desktop Preview ── */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          LinkedIn Post (Desktop)
        </h3>
        <div className="max-w-[550px] rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#1d2226]">
          <div className="flex items-center gap-2 p-3">
            <div className="bg-primary-100 text-primary-600 flex h-10 w-10 items-center justify-center rounded-full font-bold">
              YS
            </div>
            <div>
              <div className="text-[14px] font-bold dark:text-white">Yasir Shahzad</div>
              <div className="text-[12px] text-gray-500">Software Engineer @ Google</div>
            </div>
          </div>
          <div className="px-3 pb-2 text-[14px] dark:text-gray-200">
            Just published a new article! 🚀
          </div>
          <div className="relative aspect-[1.91/1] w-full border-y border-gray-100 dark:border-gray-800">
            <img src={displayImage} alt="LinkedIn preview" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-[#1d2226]">
              <div className="truncate text-[14px] font-bold dark:text-white">{displayTitle}</div>
              <div className="truncate text-[12px] text-gray-500 dark:text-gray-400">
                yasir.com.pk • 5 min read
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
