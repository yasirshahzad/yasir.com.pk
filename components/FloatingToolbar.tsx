'use client'

import React from 'react'
import ImageUploader from './ImageUploader'

interface FloatingToolbarProps {
  onBold: () => void
  onItalic: () => void
  onHeading: (level: 2 | 3) => void
  onLink: () => void
  onImage: (url: string) => void
  onDiagram: () => void
  onCallout?: (type: 'NOTE' | 'TIP' | 'WARNING') => void
  onAI: () => void
  onSave?: () => void
  onCancel?: () => void
  isSaving?: boolean
  hasChanges?: boolean
  showSaveButtons?: boolean
  aiActive?: boolean
}

export default function FloatingToolbar({
  onBold,
  onItalic,
  onHeading,
  onLink,
  onImage,
  onDiagram,
  onCallout,
  onAI,
  onSave,
  onCancel,
  isSaving = false,
  hasChanges = false,
  showSaveButtons = true,
  aiActive = false,
}: FloatingToolbarProps) {
  return (
    <div className="z-[100] flex items-center gap-2 rounded-2xl border border-gray-200/50 bg-white/90 px-3 py-2 shadow-2xl backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/90">
      {/* Formatting Group */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 dark:border-gray-700">
        <ToolbarButton onClick={onBold} title="Bold (Ctrl+B)">
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton onClick={onItalic} title="Italic (Ctrl+I)">
          <span className="font-serif italic">I</span>
        </ToolbarButton>
        <div className="mx-0.5 h-4 w-px bg-gray-100 dark:bg-gray-800" />
        <ToolbarButton onClick={() => onHeading(2)} title="Heading 2">
          <span className="text-[10px] font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => onHeading(3)} title="Heading 3">
          <span className="text-[10px] font-bold">H3</span>
        </ToolbarButton>
      </div>

      {/* Insert Group */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 dark:border-gray-700">
        <ToolbarButton onClick={onLink} title="Add Link">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </ToolbarButton>

        <ImageUploader onUploadSuccess={onImage} label="" />

        <ToolbarButton onClick={onDiagram} title="Insert AI Diagram">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        </ToolbarButton>
      </div>

      {/* Special Blocks */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 dark:border-gray-700">
        <ToolbarButton onClick={() => onCallout && onCallout('NOTE')} title="Add Note Callout">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onCallout && onCallout('TIP')} title="Add Tip Callout">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </ToolbarButton>
      </div>

      {/* AI & Actions */}
      <div className="ml-1 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onAI}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            aiActive
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
              : 'text-purple-600 hover:bg-purple-500/10 dark:text-purple-400'
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          AI Assistant
        </button>

        {showSaveButtons && (
          <>
            <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving || !hasChanges}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  isSaving || !hasChanges
                    ? 'cursor-not-allowed text-gray-400'
                    : 'text-primary-500 hover:bg-primary-500/10'
                }`}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-400 transition-all hover:bg-gray-500/10 hover:text-gray-600"
              >
                Discard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-8 w-8 transform items-center justify-center rounded-lg text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 active:scale-90 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      {children}
    </button>
  )
}
