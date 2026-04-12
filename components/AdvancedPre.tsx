'use client'

import { useState, useRef, ReactNode } from 'react'

export default function AdvancedPre({ children, ...props }: { children: any; [key: string]: any }) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  // Extract language from children className generically passed by Rehype plugins
  let language = ''
  if (children && children.props && children.props.className) {
    const match = children.props.className.match(/language-(\w+)/)
    if (match) {
      language = match[1]
    }
  }

  const handleCopy = async () => {
    if (preRef.current) {
      const text = preRef.current.innerText
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy text', err)
      }
    }
  }

  return (
    <div className="group relative my-6 overflow-hidden rounded-xl bg-gray-900 border border-gray-800 shadow-2xl">
      {/* Top action bar */}
      <div className="flex items-center justify-between bg-gray-800/80 px-4 py-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          {language || 'Code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded bg-gray-700/50 px-2 py-1 text-xs font-semibold text-gray-300 transition-all hover:bg-gray-600 hover:text-white"
        >
          {copied ? (
            <>
              <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      <pre ref={preRef} className="p-4 overflow-x-auto text-sm leading-relaxed text-gray-100 no-scrollbar mt-0" {...props}>
        {children}
      </pre>
    </div>
  )
}
