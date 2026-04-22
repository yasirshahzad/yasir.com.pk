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
  const displaySummary = summary || 'No description provided. Add a summary to improve SEO and social sharing...'
  const displayImage = image || 'https://yasir.com.pk/static/images/social-banner.png'

  return (
    <div className="space-y-10 p-2">
      {/* ── Google Search Preview ── */}
      <section className="space-y-3">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Google Search Result</label>
        <div className="max-w-[600px] bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="text-[14px] text-[#202124] dark:text-[#bdc1c6] mb-1 truncate">
            https://{url}
          </div>
          <div className="text-[20px] text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium mb-1 truncate">
            {displayTitle}
          </div>
          <div className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-relaxed">
            {displaySummary}
          </div>
        </div>
      </section>

      {/* ── Twitter / X Card ── */}
      <section className="space-y-3">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Twitter (X) Preview</label>
        <div className="max-w-[500px] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-black">
          <div className="relative aspect-[1.91/1] w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
            <img src={displayImage} alt="Social banner" className="w-full h-full object-cover" />
          </div>
          <div className="p-3 space-y-1 border-t border-gray-100 dark:border-gray-800">
            <div className="text-[12px] text-gray-500 uppercase tracking-tight">yasir.com.pk</div>
            <div className="text-[14px] font-bold text-gray-900 dark:text-gray-100 truncate">{displayTitle}</div>
            <div className="text-[14px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug">{displaySummary}</div>
          </div>
        </div>
      </section>

      {/* ── LinkedIn Desktop Preview ── */}
      <section className="space-y-3">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">LinkedIn Post (Desktop)</label>
        <div className="max-w-[550px] bg-white dark:bg-[#1d2226] border border-gray-200 dark:border-gray-700 rounded shadow-sm">
          <div className="p-3 flex items-center gap-2">
             <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600">YS</div>
             <div>
               <div className="text-[14px] font-bold dark:text-white">Yasir Shahzad</div>
               <div className="text-[12px] text-gray-500">Software Engineer @ Google</div>
             </div>
          </div>
          <div className="px-3 pb-2 text-[14px] dark:text-gray-200">Just published a new article! 🚀</div>
          <div className="relative aspect-[1.91/1] w-full border-y border-gray-100 dark:border-gray-800">
            <img src={displayImage} alt="LinkedIn preview" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-white dark:bg-[#1d2226] p-3 border-t border-gray-100 dark:border-gray-800">
              <div className="text-[14px] font-bold dark:text-white truncate">{displayTitle}</div>
              <div className="text-[12px] text-gray-500 dark:text-gray-400 truncate">yasir.com.pk • 5 min read</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
