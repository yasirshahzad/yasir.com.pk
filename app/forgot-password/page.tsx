'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '../login/actions'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await requestPasswordReset(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setMessage('Check your email for the password reset link.')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter your email and we'll send you a link to get back into your account.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border border-gray-200 bg-white px-4 py-8 shadow-xl sm:rounded-xl sm:px-10 dark:border-gray-800 dark:bg-gray-900">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {message && (
              <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/30">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">{message}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
