'use client'

import { useState } from 'react'

export type QuizOption = {
  text: string
  isCorrect: boolean
  explanation?: string
}

export default function QuizQuestion({ question, options }: { question: string, options: QuizOption[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  const handleSelect = (idx: number) => {
    if (hasAnswered) return // Prevent multiple guesses for gamification integrity
    setSelectedIdx(idx)
    setHasAnswered(true)
  }

  return (
    <div className="my-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold dark:bg-primary-900/40 dark:text-primary-400">
          ?
        </span>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 m-0 leading-tight">
          Knowledge Check
        </h3>
      </div>
      
      <p className="mb-6 text-gray-700 dark:text-gray-300 font-medium">
        {question}
      </p>

      <div className="space-y-3">
        {options.map((option, idx) => {
          let styleClass = "border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          
          if (hasAnswered) {
            if (option.isCorrect) {
              styleClass = "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/30 dark:border-green-600 dark:text-green-100"
            } else if (selectedIdx === idx) {
              // They picked wrong
              styleClass = "border-red-500 bg-red-50 text-red-900 dark:bg-red-900/30 dark:border-red-600 dark:text-red-100 opacity-60"
            } else {
              // Other wrong answers
              styleClass = "border-gray-200 bg-gray-50 opacity-40 dark:border-gray-700 dark:bg-gray-800"
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={hasAnswered}
              className={`w-full text-left px-5 py-3 rounded-xl border-2 transition-all font-medium ${styleClass}`}
            >
              <div className="flex justify-between items-center">
                <span>{option.text}</span>
                {hasAnswered && option.isCorrect && <span>✅</span>}
                {hasAnswered && selectedIdx === idx && !option.isCorrect && <span>❌</span>}
              </div>
            </button>
          )
        })}
      </div>

      {/* Reveal Explanation softly */}
      {hasAnswered && selectedIdx !== null && (
        <div className={`mt-6 rounded-lg p-4 text-sm font-semibold border ${options[selectedIdx].isCorrect ? 'bg-green-50/50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' : 'bg-red-50/50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'}`}>
          <p className="mb-1 uppercase tracking-wider text-xs opacity-70">
            {options[selectedIdx].isCorrect ? 'Brilliant!' : 'Not quite!'}
          </p>
          <p>
            {options[selectedIdx].explanation || (options[selectedIdx].isCorrect ? "Spot on. Keep reading." : "Keep studying and reviewing these concepts!")}
          </p>
        </div>
      )}
    </div>
  )
}
